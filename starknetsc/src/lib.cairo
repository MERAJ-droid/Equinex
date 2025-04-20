// SPDX-License-Identifier: MIT
#[starknet::contract]
mod StartupFunding {
    use starknet::get_caller_address;
    use starknet::ContractAddress;

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

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.startups_count.write(0);
        self.verifier.write(get_caller_address());
        self.loans_count.write(0);
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

    // Fund a startup with a specific amount
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
        
        // Emit event
        self.emit(StartupFunded { 
            id, 
            funder, 
            amount 
        });
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
        
        // For simplicity, we'll just check if they're equal or if funds are less
        let total_with_new = total_milestone_funds + fund_amount;
        let funds_difference = collected - total_with_new;
        let insufficient_funds = funds_difference + collected;
        assert(insufficient_funds != collected, 'Not enough funds available');

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
