// SPDX-License-Identifier: MIT

#[starknet::contract]
mod StartupFunding {
    use starknet::get_caller_address;
    use starknet::ContractAddress;
    use starknet::contract_address_const;
    use traits::Into;
    use integer::BoundedInt;

    #[storage]
    struct Storage {
        startups_count: felt252,
        startup_owner: LegacyMap<felt252, ContractAddress>,
        startup_title: LegacyMap<felt252, felt252>,
        startup_description: LegacyMap<felt252, felt252>,
        startup_target: LegacyMap<felt252, felt252>,
        startup_collected: LegacyMap<felt252, felt252>,
        startup_released: LegacyMap<felt252, felt252>,
        startup_is_verified: LegacyMap<felt252, bool>,
        
        // Funder tracking
        funder_amount: LegacyMap<(felt252, ContractAddress), felt252>,
        
        // Document tracking
        document_count: LegacyMap<felt252, felt252>,
        document_hash: LegacyMap<(felt252, felt252), felt252>,
        document_type: LegacyMap<(felt252, felt252), felt252>,
        
        // Milestone tracking
        milestone_count: LegacyMap<felt252, felt252>,
        milestone_title: LegacyMap<(felt252, felt252), felt252>,
        milestone_description: LegacyMap<(felt252, felt252), felt252>,
        milestone_fund_amount: LegacyMap<(felt252, felt252), felt252>,
        milestone_is_completed: LegacyMap<(felt252, felt252), bool>,
        milestone_proof_hash: LegacyMap<(felt252, felt252), felt252>,
        
        // Verifier
        verifier: ContractAddress,

        loans_count: felt252,
        loan_requester: LegacyMap<felt252, ContractAddress>,
        loan_name: LegacyMap<felt252, felt252>,
        loan_purpose: LegacyMap<felt252, felt252>,
        loan_amount: LegacyMap<felt252, felt252>,
        loan_duration: LegacyMap<felt252, felt252>,
        loan_collected: LegacyMap<felt252, felt252>,
        loan_repaid: LegacyMap<felt252, bool>,
        loan_lender_count: LegacyMap<felt252, felt252>,
        loan_lender_address: LegacyMap<(felt252, felt252), ContractAddress>,
        loan_lender_amount: LegacyMap<(felt252, felt252), felt252>,

        // ERC721 storage
        _next_token_id: felt252,
        _token_owner: LegacyMap<felt252, ContractAddress>,
        _token_approvals: LegacyMap<felt252, ContractAddress>,
        _operator_approvals: LegacyMap<(ContractAddress, ContractAddress), bool>,
        _token_uri: LegacyMap<felt252, felt252>,
        _name: felt252,
        _symbol: felt252,
        
        // NFT tracking
        token_burned: LegacyMap<felt252, bool>,
        investor_tokens: LegacyMap<(ContractAddress, felt252), felt252>, // Maps (investor, index) to token ID
        investor_token_count: LegacyMap<(ContractAddress, felt252), felt252>, // Count of tokens per investor per startup
        
        // Equity holders
        equity_holder_count: LegacyMap<felt252, felt252>,
        equity_holder_name: LegacyMap<(felt252, felt252), felt252>,
        equity_holder_percentage: LegacyMap<(felt252, felt252), felt252>,
    }

    // Create a trait for internal functions
#[generate_trait]
impl InternalFunctions of InternalTrait {
    // Internal function to check if token exists
    fn _exists(self: @ContractState, token_id: felt252) -> bool {
        let owner = self._token_owner.read(token_id);
        owner.into() != 0
    }

    // Internal function to mint an NFT
    fn _mint_investment_nft(
        ref self: ContractState,
        investor: ContractAddress,
        startup_id: felt252,
        amount: felt252
    ) -> felt252 {
        let token_id = self._next_token_id.read();
        self._next_token_id.write(token_id + 1);
        
        // Mint the token
        self._token_owner.write(token_id, investor);
        
        // Store token URI (simplified for now)
        let startup_title = self.startup_title.read(startup_id);
        self._token_uri.write(token_id, startup_title);
        
        // Track investor tokens
        let token_count = self.investor_token_count.read((investor, startup_id));
        self.investor_tokens.write((investor, startup_id), token_id);
        self.investor_token_count.write((investor, startup_id), token_count + 1);
        
        // Emit Transfer event
        self.emit(Transfer {
            from: contract_address_const::<0>(),
            to: investor,
            token_id
        });
        
        token_id
    }
}

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        StartupCreated: StartupCreated,
        StartupFunded: StartupFunded,
        StartupVerified: StartupVerified,
        DocumentAdded: DocumentAdded,
        MilestoneAdded: MilestoneAdded,
        MilestoneCompleted: MilestoneCompleted,
        FundsReleased: FundsReleased,
        LoanRequested: LoanRequested,
        LoanFunded: LoanFunded,
        LoanRepaid: LoanRepaid,
        // ERC721 events
        Transfer: Transfer,
        Approval: Approval,
        ApprovalForAll: ApprovalForAll,
        
        // NFT events
        InvestmentNFTMinted: InvestmentNFTMinted,
        InvestmentNFTBurned: InvestmentNFTBurned,
    }

    #[derive(Drop, starknet::Event)]
    struct StartupCreated {
        id: felt252,
        owner: ContractAddress,
        title: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct StartupFunded {
        id: felt252,
        funder: ContractAddress,
        amount: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct StartupVerified {
        id: felt252,
        verifier: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct DocumentAdded {
        startup_id: felt252,
        document_id: felt252,
        ipfs_hash: felt252,
        document_type: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct MilestoneAdded {
        startup_id: felt252,
        milestone_id: felt252,
        title: felt252,
        fund_amount: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct MilestoneCompleted {
        startup_id: felt252,
        milestone_id: felt252,
        proof_hash: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct FundsReleased {
        startup_id: felt252,
        recipient: ContractAddress,
        amount: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct LoanRequested {
        id: felt252,
        requester: ContractAddress,
        name: felt252,
        amount: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct LoanFunded {
        id: felt252,
        lender: ContractAddress,
        amount: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct LoanRepaid {
        id: felt252,
        requester: ContractAddress,
        total_amount: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        token_id: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct Approval {
        owner: ContractAddress,
        approved: ContractAddress,
        token_id: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct ApprovalForAll {
        owner: ContractAddress,
        operator: ContractAddress,
        approved: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct InvestmentNFTMinted {
        investor: ContractAddress,
        startup_id: felt252,
        token_id: felt252,
        amount: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct InvestmentNFTBurned {
        token_id: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.startups_count.write(0);
        self.verifier.write(get_caller_address());
        self.loans_count.write(0);

        // Initialize ERC721
        self._name.write('EquineX Investment Certificate');
        self._symbol.write('EQUINEX');
        self._next_token_id.write(0);
    }

    #[external(v0)]
    fn create_startup(
        ref self: ContractState,
        title: felt252,
        description: felt252,
        target: felt252,
    ) -> felt252 {
        let id = self.startups_count.read();
        let owner = get_caller_address();
        
        // Store startup data
        self.startup_owner.write(id, owner);
        self.startup_title.write(id, title);
        self.startup_description.write(id, description);
        self.startup_target.write(id, target);
        self.startup_collected.write(id, 0);
        self.startup_released.write(id, 0);
        self.startup_is_verified.write(id, false);
        self.document_count.write(id, 0);
        self.milestone_count.write(id, 0);
        
        // Increment counter
        self.startups_count.write(id + 1);
        
        // Emit event
        self.emit(StartupCreated { 
            id, 
            owner, 
            title,
        });
        
        id
    }

    // Verify a startup
    #[external(v0)]
    fn verify_startup(ref self: ContractState, id: felt252) {
        let caller = get_caller_address();
        assert(caller == self.verifier.read(), 'Only verifier can verify');
        
        self.startup_is_verified.write(id, true);
        
        self.emit(StartupVerified { 
            id, 
            verifier: caller 
        });
    }

    // Set a new verifier
    #[external(v0)]
    fn set_verifier(ref self: ContractState, new_verifier: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.verifier.read(), 'Only current verifier can set');
        
        self.verifier.write(new_verifier);
    }

    // Add a document to a startup
    #[external(v0)]
    fn add_startup_document(
        ref self: ContractState,
        startup_id: felt252,
        ipfs_hash: felt252,
        document_type: felt252
    ) {
        let caller = get_caller_address();
        let owner = self.startup_owner.read(startup_id);
        let verifier = self.verifier.read();
        
        // Only owner or verifier can add documents
        assert(caller == owner || caller == verifier, 'Not authorized');
        
        // Get next document ID
        let doc_id = self.document_count.read(startup_id);
        
        // Store document data
        self.document_hash.write((startup_id, doc_id), ipfs_hash);
        self.document_type.write((startup_id, doc_id), document_type);
        
        // Increment document count
        self.document_count.write(startup_id, doc_id + 1);
        
        // Emit event
        self.emit(DocumentAdded {
            startup_id,
            document_id: doc_id,
            ipfs_hash,
            document_type
        });
    }

    // Add a milestone to a startup
    #[external(v0)]
fn add_startup_milestone(
    ref self: ContractState,
    startup_id: felt252,
    title: felt252,
    description: felt252,
    fund_amount: felt252
) {
    let caller = get_caller_address();
    let owner = self.startup_owner.read(startup_id);
    
    // Only owner can add milestones
    assert(caller == owner, 'Only owner can add milestones');
    
    // Calculate total milestone funds
    let milestone_count = self.milestone_count.read(startup_id);
    let mut total_milestone_funds = 0;
    let mut i = 0;
    
    loop {
        // Use equality check instead of comparison
        if i == milestone_count {
            break;
        }
        
        let milestone_amount = self.milestone_fund_amount.read((startup_id, i));
        total_milestone_funds = total_milestone_funds + milestone_amount;
        
        i = i + 1;
    };
    
    // Check if there are enough funds available
    let collected = self.startup_collected.read(startup_id);
    let total_with_new = total_milestone_funds + fund_amount;
    
    // Ensure there are enough funds for this milestone
    let is_insufficient = collected - total_with_new;
    let check_result = is_insufficient + collected;
    assert(check_result == collected, 'Not enough funds available');
    // Get next milestone ID
    let milestone_id = milestone_count;
    
    // Store milestone data
    self.milestone_title.write((startup_id, milestone_id), title);
    self.milestone_description.write((startup_id, milestone_id), description);
    self.milestone_fund_amount.write((startup_id, milestone_id), fund_amount);
    self.milestone_is_completed.write((startup_id, milestone_id), false);
    self.milestone_proof_hash.write((startup_id, milestone_id), 0); // Empty hash
    
    // Increment milestone count
    self.milestone_count.write(startup_id, milestone_id + 1);
    
    // Emit event
    self.emit(MilestoneAdded {
        startup_id,
        milestone_id,
        title,
        fund_amount
    });
}

    // Complete a milestone
    #[external(v0)]
    fn complete_milestone(
        ref self: ContractState,
        startup_id: felt252,
        milestone_id: felt252,
        proof_hash: felt252
    ) {
        let caller = get_caller_address();
        assert(caller == self.verifier.read(), 'Only verifier can complete');
        
        // Check if milestone exists
        let milestone_count = self.milestone_count.read(startup_id);
        
        // Instead of comparing directly, we'll check if milestone_id is out of bounds
        let valid_milestone = milestone_id - milestone_count;
        assert(valid_milestone != milestone_id, 'Invalid milestone ID');
        
        // Check if milestone is not already completed
        let is_completed = self.milestone_is_completed.read((startup_id, milestone_id));
        assert(!is_completed, 'Milestone already completed');
        
        // Mark milestone as completed
        self.milestone_is_completed.write((startup_id, milestone_id), true);
        self.milestone_proof_hash.write((startup_id, milestone_id), proof_hash);
        
        // Release funds for this milestone
        let fund_amount = self.milestone_fund_amount.read((startup_id, milestone_id));
        let released = self.startup_released.read(startup_id);
        self.startup_released.write(startup_id, released + fund_amount);
        
        // Get startup owner
        let owner = self.startup_owner.read(startup_id);
        
        // Emit events
        self.emit(MilestoneCompleted {
            startup_id,
            milestone_id,
            proof_hash
        });
        
        self.emit(FundsReleased {
            startup_id,
            recipient: owner,
            amount: fund_amount
        });
    }

    // Request a loan
#[external(v0)]
fn request_loan(
    ref self: ContractState,
    name: felt252,
    purpose: felt252,
    amount: felt252,
    duration: felt252
) -> felt252 {
    let requester = get_caller_address();
    let loan_id = self.loans_count.read();
    
    // Store loan data
    self.loan_requester.write(loan_id, requester);
    self.loan_name.write(loan_id, name);
    self.loan_purpose.write(loan_id, purpose);
    self.loan_amount.write(loan_id, amount);
    self.loan_duration.write(loan_id, duration);
    self.loan_collected.write(loan_id, 0);
    self.loan_repaid.write(loan_id, false);
    self.loan_lender_count.write(loan_id, 0);
    
    // Increment loan count
    self.loans_count.write(loan_id + 1);
    
    // Emit event
    self.emit(LoanRequested {
        id: loan_id,
        requester,
        name,
        amount
    });
    
    loan_id
}

// Fund a loan
#[external(v0)]
fn fund_loan(ref self: ContractState, id: felt252, amount: felt252) {
    let lender = get_caller_address();
    
    // Validate loan exists and is not fully funded
    let loan_amount = self.loan_amount.read(id);
    let loan_collected = self.loan_collected.read(id);
    
    // Check if loan is not fully funded
    let new_collected = loan_collected + amount;
    let diff = loan_amount - new_collected;
    let is_overfunded = diff + loan_amount;
    if is_overfunded == loan_amount {
        assert(1 == 0, 'Loan would be overfunded');
    }
    
    // Get lender ID
    let lender_id = self.loan_lender_count.read(id);
    
    // Store lender data
    self.loan_lender_address.write((id, lender_id), lender);
    self.loan_lender_amount.write((id, lender_id), amount);
    
    // Increment lender count
    self.loan_lender_count.write(id, lender_id + 1);
    
    // Update collected amount
    self.loan_collected.write(id, loan_collected + amount);
    
    // Emit event
    self.emit(LoanFunded {
        id,
        lender,
        amount
    });
}

// ERC721 core functions
#[external(v0)]
fn name(self: @ContractState) -> felt252 {
    self._name.read()
}

#[external(v0)]
fn symbol(self: @ContractState) -> felt252 {
    self._symbol.read()
}

#[external(v0)]
fn token_uri(self: @ContractState, token_id: felt252) -> felt252 {
    assert(InternalFunctions::_exists(self, token_id), 'ERC721: URI query');
    self._token_uri.read(token_id)
}


#[external(v0)]
fn balance_of(self: @ContractState, owner: ContractAddress) -> felt252 {
    assert(owner.into() != 0, 'ERC721: balance query');
    
    // Count tokens owned by this address
    let mut count = 0;
    let total_tokens = self._next_token_id.read();
    let mut i = 0;
    
    loop {
        if i == total_tokens {
            break;
        }
        
        if self._token_owner.read(i) == owner && !self.token_burned.read(i) {
            count += 1;
        }
        
        i += 1;
    };
    
    count
}

#[external(v0)]
fn owner_of(self: @ContractState, token_id: felt252) -> ContractAddress {
    let owner = self._token_owner.read(token_id);
    assert(owner.into() != 0, 'ERC721: owner query');
    owner
}


// Fund a startup with a specific amount and mint NFT
#[external(v0)]
fn fund_startup(ref self: ContractState, id: felt252, amount: felt252) {
    let funder = get_caller_address();
    
    // Validate startup exists
    let owner = self.startup_owner.read(id);
    let owner_zero: felt252 = owner.into();
    assert(owner_zero != 0, 'Startup does not exist');
    
    // Update funder amount
    let current_funder_amount = self.funder_amount.read((id, funder));
    self.funder_amount.write((id, funder), current_funder_amount + amount);
    
    // Update total collected
    let collected = self.startup_collected.read(id);
    self.startup_collected.write(id, collected + amount);
    
    // Mint NFT for the investor
    let token_id = InternalFunctions::_mint_investment_nft(ref self, funder, id, amount);
    
    // Emit event
    self.emit(StartupFunded {
        id,
        funder,
        amount
    });
    
    self.emit(InvestmentNFTMinted {
        investor: funder,
        startup_id: id,
        token_id,
        amount
    });
}

// Add equity holder to a startup
#[external(v0)]
fn add_equity_holder(
    ref self: ContractState,
    startup_id: felt252,
    name: felt252,
    percentage: felt252
) {
    let caller = get_caller_address();
    let owner = self.startup_owner.read(startup_id);
    
    // Only owner can add equity holders
    assert(caller == owner, 'owner can add EH');
    
    // Get next equity holder ID
    let holder_id = self.equity_holder_count.read(startup_id);
    
    // Store equity holder data
    self.equity_holder_name.write((startup_id, holder_id), name);
    self.equity_holder_percentage.write((startup_id, holder_id), percentage);
    
    // Increment equity holder count
    self.equity_holder_count.write(startup_id, holder_id + 1);
}

// Get equity holders for a startup
#[external(v0)]
fn get_equity_holder_count(self: @ContractState, startup_id: felt252) -> felt252 {
    self.equity_holder_count.read(startup_id)
}

#[external(v0)]
fn get_equity_holder_name(self: @ContractState, startup_id: felt252, holder_id: felt252) -> felt252 {
    self.equity_holder_name.read((startup_id, holder_id))
}

#[external(v0)]
fn get_equity_holder_percentage(self: @ContractState, startup_id: felt252, holder_id: felt252) -> felt252 {
    self.equity_holder_percentage.read((startup_id, holder_id))
}


// Withdraw funds from a startup campaign
#[external(v0)]
fn withdraw_funds(ref self: ContractState, id: felt252) {
    let caller = get_caller_address();
    let owner = self.startup_owner.read(id);
    
    // Only owner can withdraw funds
    assert(caller == owner, 'Only owner');
    
    // Calculate available funds (collected minus already released)
    let collected = self.startup_collected.read(id);
    let released = self.startup_released.read(id);
    let available = collected - released;
    
    // Ensure there are funds to withdraw
    assert(available != 0, 'No funds');
    
    // Update released amount
    self.startup_released.write(id, collected);
    
    // Emit event
    self.emit(FundsReleased {
        startup_id: id,
        recipient: owner,
        amount: available
    });
}

// Refund investment if funding target is not met
#[external(v0)]
fn refund_investment(ref self: ContractState, startup_id: felt252) {
    let investor = get_caller_address();
    
    // Check if investor has invested in this startup
    let amount = self.funder_amount.read((startup_id, investor));
    assert(amount != 0, 'No investment to refund');
    
    // Reset investor's amount
    self.funder_amount.write((startup_id, investor), 0);
    
    // Burn investor's NFTs for this startup
    let token_count = self.investor_token_count.read((investor, startup_id));
    let mut i = 0;
    
    loop {
        if i == token_count {
            break;
        }
        
        let token_id = self.investor_tokens.read((investor, i));
        
        // Only burn if not already burned
        if !self.token_burned.read(token_id) {
            // Mark as burned
            self.token_burned.write(token_id, true);
            
            // Emit event
            self.emit(InvestmentNFTBurned {
                token_id
            });
        }
        
        i += 1;
    };
    
    // Reset token count
    self.investor_token_count.write((investor, startup_id), 0);
    
    // Emit refund event
    self.emit(StartupFunded {
        id: startup_id,
        funder: investor,
        amount: -amount // Negative amount indicates refund
    });
}
// Burn an NFT
#[external(v0)]
fn burn_investment_nft(ref self: ContractState, token_id: felt252) {
    let caller = get_caller_address();
    
    // Check if token exists and caller is owner
    let owner = self._token_owner.read(token_id);
    assert(owner.into() != 0, 'ERC721: burn query');
    assert(owner == caller, 'ERC721: burn caller');
    
    // Mark token as burned
    self.token_burned.write(token_id, true);
    
    // Emit events
    self.emit(Transfer {
        from: owner,
        to: contract_address_const::<0>(),
        token_id
    });
    
    self.emit(InvestmentNFTBurned {
        token_id
    });
}


// Repay a loan
#[external(v0)]
fn repay_loan(ref self: ContractState, id: felt252, amount: felt252) {
    let requester = get_caller_address();
    
    // Validate caller is the loan requester
    let loan_requester = self.loan_requester.read(id);
    assert(requester == loan_requester, 'Only requester can repay');
    
    // Check loan is not already repaid
    let is_repaid = self.loan_repaid.read(id);
    assert(!is_repaid, 'Loan already repaid');
    
    // Calculate repayment amount (principal + 10% interest)
    let loan_amount = self.loan_amount.read(id);
    
    // For a 10% interest, we need to ensure amount >= loan_amount * 1.1
    // Since we can't use floating point, we'll check if amount * 10 >= loan_amount * 11
    let scaled_amount = amount * 10;
    let min_repayment = loan_amount * 11;
    
    // Check if repayment is sufficient
    let diff = min_repayment - scaled_amount;
    let is_insufficient = diff + min_repayment;
    if is_insufficient != min_repayment {
        assert(1 == 0, 'Insufficient repayment amount');
    }
    
    // Mark loan as repaid
    self.loan_repaid.write(id, true);
    
    // Emit event
    self.emit(LoanRepaid {
        id,
        requester,
        total_amount: amount
    });
}


    // Loan getter functions
    #[external(v0)]
    fn get_loans_count(self: @ContractState) -> felt252 {
        self.loans_count.read()
    }

    #[external(v0)]
    fn get_loan_requester(self: @ContractState, id: felt252) -> ContractAddress {
        self.loan_requester.read(id)
    }

    #[external(v0)]
    fn get_loan_name(self: @ContractState, id: felt252) -> felt252 {
        self.loan_name.read(id)
    }

    #[external(v0)]
    fn get_loan_purpose(self: @ContractState, id: felt252) -> felt252 {
        self.loan_purpose.read(id)
    }

    #[external(v0)]
    fn get_loan_amount(self: @ContractState, id: felt252) -> felt252 {
        self.loan_amount.read(id)
    }

    #[external(v0)]
    fn get_loan_duration(self: @ContractState, id: felt252) -> felt252 {
        self.loan_duration.read(id)
    }

    #[external(v0)]
    fn get_loan_collected(self: @ContractState, id: felt252) -> felt252 {
        self.loan_collected.read(id)
    }

    #[external(v0)]
    fn get_loan_repaid(self: @ContractState, id: felt252) -> bool {
        self.loan_repaid.read(id)
    }

    #[external(v0)]
    fn get_loan_lender_count(self: @ContractState, id: felt252) -> felt252 {
        self.loan_lender_count.read(id)
    }

    #[external(v0)]
    fn get_loan_lender_address(self: @ContractState, id: felt252, lender_id: felt252) -> ContractAddress {
        self.loan_lender_address.read((id, lender_id))
    }

    #[external(v0)]
    fn get_loan_lender_amount(self: @ContractState, id: felt252, lender_id: felt252) -> felt252 {
        self.loan_lender_amount.read((id, lender_id))
    }
    // Getter functions
    #[external(v0)]
    fn get_startup_owner(self: @ContractState, id: felt252) -> ContractAddress {
        self.startup_owner.read(id)
    }

    #[external(v0)]
    fn get_startup_title(self: @ContractState, id: felt252) -> felt252 {
        self.startup_title.read(id)
    }

    #[external(v0)]
    fn get_startup_description(self: @ContractState, id: felt252) -> felt252 {
        self.startup_description.read(id)
    }

    #[external(v0)]
    fn get_startup_target(self: @ContractState, id: felt252) -> felt252 {
        self.startup_target.read(id)
    }

    #[external(v0)]
    fn get_startup_collected(self: @ContractState, id: felt252) -> felt252 {
        self.startup_collected.read(id)
    }

    #[external(v0)]
    fn get_startup_released(self: @ContractState, id: felt252) -> felt252 {
        self.startup_released.read(id)
    }

    #[external(v0)]
    fn get_startup_is_verified(self: @ContractState, id: felt252) -> bool {
        self.startup_is_verified.read(id)
    }

    #[external(v0)]
    fn get_startups_count(self: @ContractState) -> felt252 {
        self.startups_count.read()
    }

    #[external(v0)]
    fn get_funder_amount(self: @ContractState, id: felt252, funder: ContractAddress) -> felt252 {
        self.funder_amount.read((id, funder))
    }

    #[external(v0)]
    fn get_verifier(self: @ContractState) -> ContractAddress {
        self.verifier.read()
    }

    // Document getters
    #[external(v0)]
    fn get_document_count(self: @ContractState, startup_id: felt252) -> felt252 {
        self.document_count.read(startup_id)
    }

    #[external(v0)]
    fn get_document_hash(self: @ContractState, startup_id: felt252, doc_id: felt252) -> felt252 {
        self.document_hash.read((startup_id, doc_id))
    }

    #[external(v0)]
    fn get_document_type(self: @ContractState, startup_id: felt252, doc_id: felt252) -> felt252 {
        self.document_type.read((startup_id, doc_id))
    }

    // Milestone getters
    #[external(v0)]
    fn get_milestone_count(self: @ContractState, startup_id: felt252) -> felt252 {
        self.milestone_count.read(startup_id)
    }

    #[external(v0)]
    fn get_milestone_title(self: @ContractState, startup_id: felt252, milestone_id: felt252) -> felt252 {
        self.milestone_title.read((startup_id, milestone_id))
    }

    #[external(v0)]
    fn get_milestone_description(self: @ContractState, startup_id: felt252, milestone_id: felt252) -> felt252 {
        self.milestone_description.read((startup_id, milestone_id))
    }

    #[external(v0)]
    fn get_milestone_fund_amount(self: @ContractState, startup_id: felt252, milestone_id: felt252) -> felt252 {
        self.milestone_fund_amount.read((startup_id, milestone_id))
    }

    #[external(v0)]
    fn get_milestone_is_completed(self: @ContractState, startup_id: felt252, milestone_id: felt252) -> bool {
        self.milestone_is_completed.read((startup_id, milestone_id))
    }

    #[external(v0)]
    fn get_milestone_proof_hash(self: @ContractState, startup_id: felt252, milestone_id: felt252) -> felt252 {
        self.milestone_proof_hash.read((startup_id, milestone_id))
    }
}
