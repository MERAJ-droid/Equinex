// SPDX-License-Identifier: MIT
use starknet::ContractAddress;

// Define the interface
#[starknet::interface]
trait IStartupFunding<TContractState> {
    fn set_verifier(ref self: TContractState, _verifier: ContractAddress);
    fn get_verifier(self: @TContractState) -> ContractAddress;
    fn create_startup(
        ref self: TContractState,
        _owner: ContractAddress,
        _title: felt252,
        _description: felt252,
        _pitch_video: felt252,
        _image: felt252,
        _target: u256,
        _deadline: u64
    ) -> u256;
    fn verify_startup(ref self: TContractState, _id: u256);
    
    // Document management functions
    fn add_startup_document(
        ref self: TContractState,
        _id: u256,
        _ipfs_hash: felt252,
        _document_type: felt252
    );
    
    fn get_startup_documents(
        self: @TContractState,
        _id: u256
    ) -> Array<StartupFunding::Document>;
    
    fn request_loan(
        ref self: TContractState,
        _requester: ContractAddress,
        _name: felt252,
        _purpose: felt252,
        _amount: u256,
        _duration: u64
    ) -> u256;
    
    fn add_loan_document(
        ref self: TContractState,
        _id: u256,
        _ipfs_hash: felt252,
        _document_type: felt252
    );
    
    fn fund_loan(
        ref self: TContractState,
        _id: u256,
        _amount: u256
    );
    
    fn withdraw_loan_funds(
        ref self: TContractState,
        _id: u256
    );
    
    fn repay_loan(
        ref self: TContractState,
        _id: u256,
        _amount: u256
    );
    
    fn get_loan_documents(
        self: @TContractState,
        _id: u256
    ) -> Array<StartupFunding::Document>;
    
    fn get_loan_lenders(
        self: @TContractState,
        _id: u256
    ) -> Array<StartupFunding::Funder>;
    
    fn get_loan(
        self: @TContractState,
        _id: u256
    ) -> StartupFunding::LoanRequest;
    
    fn get_all_loans(
        self: @TContractState
    ) -> Array<StartupFunding::LoanRequest>;

    // Milestone management functions
    fn add_startup_milestone(
        ref self: TContractState,
        _id: u256,
        _title: felt252,
        _description: felt252,
        _fund_amount: u256
    );
    
    fn complete_milestone(
        ref self: TContractState,
        _startup_id: u256,
        _milestone_id: u256,
        _proof_ipfs_hash: felt252
    );
    
    fn get_startup_milestones(
        self: @TContractState,
        _id: u256
    ) -> Array<StartupFunding::Milestone>;
    
    // Funding functions
    fn fund_startup(ref self: TContractState, _id: u256, _amount: u256);
    
    fn withdraw_funds(ref self: TContractState, _id: u256);
    
    fn get_funders(self: @TContractState, _id: u256) -> Array<StartupFunding::Funder>;
    
    fn get_investor_total_amount(
        self: @TContractState,
        _investor: ContractAddress,
        _startup_id: u256
    ) -> u256;
    
    fn get_startup(self: @TContractState, _id: u256) -> StartupFunding::Startup;
    
    fn get_all_startups(self: @TContractState) -> Array<StartupFunding::Startup>;

    fn add_equity_holder(
        ref self: TContractState,
        _startup_id: u256,
        _name: felt252,
        _percentage: u256
    );
    
    fn get_equity_holders(
        self: @TContractState,
        _id: u256
    ) -> Array<StartupFunding::EquityHolder>;
    
    fn update_equity_holder(
        ref self: TContractState,
        _startup_id: u256,
        _holder_id: u32,
        _name: felt252,
        _percentage: u256
    );

    fn get_investor_tokens(
        self: @TContractState,
        _investor: ContractAddress,
        _startup_id: u256
    ) -> Array<u256>;
    
    fn is_token_burned(
        self: @TContractState,
        _token_id: u256
    ) -> bool;
    
    fn get_token_details(
        self: @TContractState,
        _token_id: u256
    ) -> (ContractAddress, u256, u256);
    
    fn burn_token(ref self: TContractState, _token_id: u256);
}

// Implement the contract
#[starknet::contract]
mod StartupFunding {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;
    use starknet::get_tx_info;
    use array::ArrayTrait;
    use traits::Into;
    use traits::TryInto;
    use option::OptionTrait;
    use starknet::event::EventEmitter;
    use starknet::syscalls::send_message_to_l1_syscall;
    
    #[derive(Drop, starknet::Store, Serde, Copy)]
    struct Funder {
        funder_address: ContractAddress,
        amount: u256,
        token_id: u256,
    }

    #[derive(Drop, starknet::Store, Serde, Copy)]
    struct EquityHolder {
        name: felt252,
        percentage: u256,
    }

    #[derive(Drop, starknet::Store, Serde, Copy)]
    struct Document {
        ipfs_hash: felt252,
        document_type: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Store, Serde, Copy)]
    struct Milestone {
        title: felt252,
        description: felt252,
        fund_amount: u256,
        is_completed: bool,
        ipfs_hash: felt252,
        completion_timestamp: u64,
    }

    #[derive(Drop, starknet::Store, Serde, Copy)]
    struct Startup {
        owner: ContractAddress,
        title: felt252,
        description: felt252,
        pitch_video: felt252,
        image: felt252,
        target: u256,
        deadline: u64,
        amount_collected: u256,
        amount_released: u256,
        is_verified: bool,
    }

    #[derive(Drop, starknet::Store, Serde, Copy)]
    struct LoanRequest {
        requester: ContractAddress,
        name: felt252,
        purpose: felt252,
        amount: u256,
        duration: u64,
        amount_collected: u256,
        repaid: bool,
    }

    #[storage]
    struct Storage {
        verifier: ContractAddress,
        startups: LegacyMap::<u256, Startup>,
        number_of_startups: u256,
        
        // Separate storage for arrays
        equity_holders_count: LegacyMap::<u256, u32>,
        equity_holders: LegacyMap::<(u256, u32), EquityHolder>,
        
        funders_count: LegacyMap::<u256, u32>,
        funders: LegacyMap::<(u256, u32), Funder>,
        
        documents_count: LegacyMap::<u256, u32>,
        documents: LegacyMap::<(u256, u32), Document>,
        
        milestones_count: LegacyMap::<u256, u32>,
        milestones: LegacyMap::<(u256, u32), Milestone>,
        
        investor_total_amount: LegacyMap::<(ContractAddress, u256), u256>,
        token_burned: LegacyMap::<u256, bool>,
        _next_token_id: u256,
        loan_requests: LegacyMap::<u256, LoanRequest>,
        number_of_loans: u256,
        
        loan_lenders_count: LegacyMap::<u256, u32>,
        loan_lenders: LegacyMap::<(u256, u32), Funder>,
        
        loan_documents_count: LegacyMap::<u256, u32>,
        loan_documents: LegacyMap::<(u256, u32), Document>,
        
        // ETH balances for contract
        eth_balances: LegacyMap::<ContractAddress, u256>,
    }

    // Event definitions
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        VerifierSet: VerifierSet,
        StartupCreated: StartupCreated,
        StartupVerified: StartupVerified,
        DocumentAdded: DocumentAdded,
        LoanRequested: LoanRequested,
        LoanDocumentAdded: LoanDocumentAdded,
        LoanFunded: LoanFunded,
        LoanWithdrawn: LoanWithdrawn,
        LoanRepaid: LoanRepaid,
        MilestoneAdded: MilestoneAdded,
        MilestoneCompleted: MilestoneCompleted,
        StartupFunded: StartupFunded,
        FundsWithdrawn: FundsWithdrawn,
        EquityHolderAdded: EquityHolderAdded,
        EquityHolderUpdated: EquityHolderUpdated,
        TokenBurned: TokenBurned,
    }

    // Event structs
    #[derive(Drop, starknet::Event)]
    struct VerifierSet {
        old_verifier: ContractAddress,
        new_verifier: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct StartupCreated {
        id: u256,
        owner: ContractAddress,
        title: felt252,
        target: u256,
        deadline: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct StartupVerified {
        id: u256,
        verifier: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct DocumentAdded {
        startup_id: u256,
        ipfs_hash: felt252,
        document_type: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct LoanRequested {
        id: u256,
        requester: ContractAddress,
        name: felt252,
        amount: u256,
        duration: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct LoanDocumentAdded {
        loan_id: u256,
        ipfs_hash: felt252,
        document_type: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct LoanFunded {
        loan_id: u256,
        lender: ContractAddress,
        amount: u256,
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct LoanWithdrawn {
        loan_id: u256,
        requester: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct LoanRepaid {
        loan_id: u256,
        requester: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct MilestoneAdded {
        startup_id: u256,
        title: felt252,
        fund_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct MilestoneCompleted {
        startup_id: u256,
        milestone_id: u256,
        proof_ipfs_hash: felt252,
        fund_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct StartupFunded {
        startup_id: u256,
        investor: ContractAddress,
        amount: u256,
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct FundsWithdrawn {
        startup_id: u256,
        owner: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct EquityHolderAdded {
        startup_id: u256,
        name: felt252,
        percentage: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct EquityHolderUpdated {
        startup_id: u256,
        holder_id: u32,
        name: felt252,
        percentage: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct TokenBurned {
        token_id: u256,
        owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.verifier.write(get_caller_address());
        self.number_of_startups.write(0);
        self._next_token_id.write(0);
        self.number_of_loans.write(0);
    }

    // Implement the interface
    #[external(v0)]
    impl StartupFundingImpl of super::IStartupFunding<ContractState> {
        fn set_verifier(ref self: ContractState, _verifier: ContractAddress) {
            let caller = get_caller_address();
            let current_verifier = self.verifier.read();
            assert(caller == current_verifier, 'Only verifier');
            
            self.verifier.write(_verifier);
            
            // Emit event
            self.emit(VerifierSet { 
                old_verifier: current_verifier, 
                new_verifier: _verifier 
            });
        }

        fn get_investor_tokens(
            self: @ContractState,
            _investor: ContractAddress,
            _startup_id: u256
        ) -> Array<u256> {
            let funder_count = self.funders_count.read(_startup_id);
            let mut tokens: Array<u256> = ArrayTrait::new();
            
            let mut i: u32 = 0;
            while i < funder_count {
                let funder = self.funders.read((_startup_id, i));
                
                if funder.funder_address == _investor && !self.token_burned.read(funder.token_id) {
                    tokens.append(funder.token_id);
                }
                
                i += 1;
            }
            
            return tokens;
        }
        
        fn is_token_burned(
            self: @ContractState,
            _token_id: u256
        ) -> bool {
            return self.token_burned.read(_token_id);
        }
        
        fn get_token_details(
            self: @ContractState,
            _token_id: u256
        ) -> (ContractAddress, u256, u256) {
            // Find the token in all startups
            let num_startups = self.number_of_startups.read();
            
            let mut i: u256 = 0;
            while i < num_startups {
                let funder_count = self.funders_count.read(i);
                
                let mut j: u32 = 0;
                while j < funder_count {
                    let funder = self.funders.read((i, j));
                    
                    if funder.token_id == _token_id {
                        // Return owner, startup ID, and amount
                        return (funder.funder_address, i, funder.amount);
                    }
                    
                    j += 1;
                }
                
                i += 1.into();
            }
            
            // If token not found, return zero values
            return (starknet::contract_address_const::<0>(), 0.into(), 0.into());
        }
        
        fn burn_token(ref self: ContractState, _token_id: u256) {
            let caller = get_caller_address();
            
            // Get token details
            let (owner, _, _) = self.get_token_details(_token_id);
            
            // Check if caller is the token owner
            assert(caller == owner, 'Only token owner can burn');
            
            // Mark token as burned
            self.token_burned.write(_token_id, true);
            
            // Emit event
            self.emit(TokenBurned { token_id: _token_id, owner: owner });
        }
        
        fn request_loan(
            ref self: ContractState,
            _requester: ContractAddress,
            _name: felt252,
            _purpose: felt252,
            _amount: u256,
            _duration: u64
        ) -> u256 {
            let loan_id = self.number_of_loans.read();
            
            let loan_request = LoanRequest {
                requester: _requester,
                name: _name,
                purpose: _purpose,
                amount: _amount,
                duration: _duration,
                amount_collected: 0.into(),
                repaid: false,
            };
            
            self.loan_requests.write(loan_id, loan_request);
            self.number_of_loans.write(loan_id + 1.into());
            
            // Emit event
            self.emit(LoanRequested { 
                id: loan_id, 
                requester: _requester, 
                name: _name, 
                amount: _amount, 
                duration: _duration 
            });
            
            return loan_id;
        }
        
        fn add_loan_document(
            ref self: ContractState,
            _id: u256,
            _ipfs_hash: felt252,
            _document_type: felt252
        ) {
            let loan_request = self.loan_requests.read(_id);
            let caller = get_caller_address();
            
            assert(
                caller == loan_request.requester || caller == self.verifier.read(),
                'Only requester or verifier'
            );
            
            let new_document = Document {
                ipfs_hash: _ipfs_hash,
                document_type: _document_type,
                timestamp: get_block_timestamp(),
            };
            
            // Get current document count
            let doc_count = self.loan_documents_count.read(_id);
            
            // Store the new document
            self.loan_documents.write((_id, doc_count), new_document);
            
            // Increment document count
            self.loan_documents_count.write(_id, doc_count + 1);
            
            // Emit event
            self.emit(LoanDocumentAdded { 
                loan_id: _id, 
                ipfs_hash: _ipfs_hash, 
                document_type: _document_type 
            });
        }
        
        fn fund_loan(
            ref self: ContractState,
            _id: u256,
            _amount: u256
        ) {
            let amount = _amount;
            let loan_request = self.loan_requests.read(_id);
            
            assert(
                loan_request.amount_collected < loan_request.amount,
                'Loan fully funded'
            );
            
            // Get the lender address
            let lender = get_caller_address();
            
            // Create a new funder record
            let token_id = self._next_token_id.read();
            self._next_token_id.write(token_id + 1.into());
            
            let new_lender = Funder {
                funder_address: lender,
                amount: amount,
                token_id: token_id,
            };
            
            // Add lender to the loan's lenders list
            let lender_count = self.loan_lenders_count.read(_id);
            self.loan_lenders.write((_id, lender_count), new_lender);
            self.loan_lenders_count.write(_id, lender_count + 1);
            
            // Update loan's collected amount
            let mut updated_loan = loan_request;
            updated_loan.amount_collected += amount;
            self.loan_requests.write(_id, updated_loan);
            
            // Update ETH balance for the contract
            let current_balance = self.eth_balances.read(lender);
            self.eth_balances.write(lender, current_balance + amount);
            
            // Emit event
            self.emit(LoanFunded { 
                loan_id: _id, 
                lender: lender, 
                amount: amount, 
                token_id: token_id 
            });
        }
        
        fn withdraw_loan_funds(
            ref self: ContractState,
            _id: u256
        ) {
            let loan_request = self.loan_requests.read(_id);
            let requester = loan_request.requester;
            let caller = get_caller_address();
            
            assert(
                caller == requester,
                'Only requester can withdraw'
            );
            
            assert(
                loan_request.amount_collected >= loan_request.amount,
                'Loan target not met'
            );
            
            let amount = loan_request.amount_collected;
            
            // Update loan's collected amount
            let mut updated_loan = loan_request;
            updated_loan.amount_collected = 0.into();
            self.loan_requests.write(_id, updated_loan);
            
            // Transfer funds to requester
            // In a real implementation, we transfer ETH to the requester
            let payload = array![requester.into(), amount.low.into(), amount.high.into()];
            send_message_to_l1_syscall(payload.span()).unwrap_syscall();
            
            // Emit event
            self.emit(LoanWithdrawn { 
                loan_id: _id, 
                requester: requester, 
                amount: amount 
            });
        }
        
        fn repay_loan(
            ref self: ContractState,
            _id: u256,
            _amount: u256
        ) {
            let loan_request = self.loan_requests.read(_id);
            let requester = loan_request.requester;
            let caller = get_caller_address();
            
            assert(
                caller == requester,
                'Only requester can repay'
            );
            
            assert(!loan_request.repaid, 'Loan already repaid');
            
            // Calculate repayment amount with 10% interest
            let repayment_amount = loan_request.amount + (loan_request.amount / 10.into());
            
            assert(_amount >= repayment_amount, 'Insufficient repayment amount');
            
            // Mark loan as repaid
            let mut updated_loan = loan_request;
            updated_loan.repaid = true;
            self.loan_requests.write(_id, updated_loan);
            
            // Distribute repayment to lenders
            let lender_count = self.loan_lenders_count.read(_id);
            
            let mut i: u32 = 0;
            while i < lender_count {
                let lender = self.loan_lenders.read((_id, i));
                let lender_share = lender.amount + (lender.amount / 10.into()); // Principal + 10% interest
                
                // Transfer funds to lender
                let payload = array![lender.funder_address.into(), lender_share.low.into(), lender_share.high.into()];
                send_message_to_l1_syscall(payload.span()).unwrap_syscall();
                
                i += 1;
            }
            
            // Emit event
            self.emit(LoanRepaid { 
                loan_id: _id, 
                requester: requester, 
                amount: _amount 
            });
        }
        
        fn get_loan_documents(
            self: @ContractState,
            _id: u256
        ) -> Array<Document> {
            let doc_count = self.loan_documents_count.read(_id);
            let mut documents: Array<Document> = ArrayTrait::new();
            
            let mut i: u32 = 0;
            while i < doc_count {
                let doc = self.loan_documents.read((_id, i));
                documents.append(doc);
                i += 1;
            }
            
            return documents;
        }
        
        fn get_loan_lenders(
            self: @ContractState,
            _id: u256
        ) -> Array<Funder> {
            let lender_count = self.loan_lenders_count.read(_id);
            let mut lenders: Array<Funder> = ArrayTrait::new();
            
            let mut i: u32 = 0;
            while i < lender_count {
                let lender = self.loan_lenders.read((_id, i));
                lenders.append(lender);
                i += 1;
            }
            
            return lenders;
        }
        
        fn get_loan(
            self: @ContractState,
            _id: u256
        ) -> LoanRequest {
            return self.loan_requests.read(_id);
        }
        
        fn get_all_loans(
            self: @ContractState
        ) -> Array<LoanRequest> {
            let num_loans = self.number_of_loans.read();
            let mut loans: Array<LoanRequest> = ArrayTrait::new();
            
            let mut i: u256 = 0;
            while i < num_loans {
                let loan = self.loan_requests.read(i);
                loans.append(loan);
                i += 1.into();
            }
            
            return loans;
        }
        
        fn add_equity_holder(
            ref self: ContractState,
            _startup_id: u256,
            _name: felt252,
            _percentage: u256
        ) {
            // Get the startup
            let startup = self.startups.read(_startup_id);
            
            // Check if the caller is the startup owner
            assert(get_caller_address() == startup.owner, 'Only owner can add equity');
            
            // Create new equity holder
            let equity_holder = EquityHolder {
                name: _name,
                percentage: _percentage,
            };
            
            // Get current equity holders count
            let equity_count = self.equity_holders_count.read(_startup_id);
            
            // Store the new equity holder
            self.equity_holders.write((_startup_id, equity_count), equity_holder);
            
            // Increment equity holders count
            self.equity_holders_count.write(_startup_id, equity_count + 1);
            
            // Validate total percentage doesn't exceed 100%
            let mut total_percentage = 0.into();
            let mut i: u32 = 0;
            
            while i < equity_count + 1 {
                let holder = self.equity_holders.read((_startup_id, i));
                total_percentage += holder.percentage;
                i += 1;
            }
            
            // 100% represented as 10000 (100.00%)
            assert(total_percentage <= 10000.into(), 'Total equity exceeds 100%');
            
            // Emit event
            self.emit(EquityHolderAdded { 
                startup_id: _startup_id, 
                name: _name, 
                percentage: _percentage 
            });
        }
        
        fn get_equity_holders(
            self: @ContractState,
            _id: u256
        ) -> Array<EquityHolder> {
            let equity_count = self.equity_holders_count.read(_id);
            let mut holders: Array<EquityHolder> = ArrayTrait::new();
            
            let mut i: u32 = 0;
            while i < equity_count {
                let holder = self.equity_holders.read((_id, i));
                holders.append(holder);
                i += 1;
            }
            
            return holders;
        }
        
        fn update_equity_holder(
            ref self: ContractState,
            _startup_id: u256,
            _holder_id: u32,
            _name: felt252,
            _percentage: u256
        ) {
            // Get the startup
            let startup = self.startups.read(_startup_id);
            
            // Check if the caller is the startup owner
            assert(get_caller_address() == startup.owner, 'Only owner can update equity');
            
            // Get equity holders count
            let equity_count = self.equity_holders_count.read(_startup_id);
            
            // Check if holder_id is valid
            assert(_holder_id < equity_count, 'Invalid equity holder ID');
            
            // Update the equity holder
            let mut holder = self.equity_holders.read((_startup_id, _holder_id));
            holder.name = _name;
            holder.percentage = _percentage;
            self.equity_holders.write((_startup_id, _holder_id), holder);
            
            // Validate total percentage doesn't exceed 100%
            let mut total_percentage = 0.into();
            let mut i: u32 = 0;
            
            while i < equity_count {
                let holder = self.equity_holders.read((_startup_id, i));
                total_percentage += holder.percentage;
                i += 1;
            }
            
            // 100% represented as 10000 (100.00%)
            assert(total_percentage <= 10000.into(), 'Total equity exceeds 100%');
            
            // Emit event
            self.emit(EquityHolderUpdated { 
                startup_id: _startup_id, 
                holder_id: _holder_id, 
                name: _name, 
                percentage: _percentage 
            });
        }
        
        fn get_verifier(self: @ContractState) -> ContractAddress {
            return self.verifier.read();
        }
        
        fn create_startup(
                        ref self: ContractState,
            _owner: ContractAddress,
            _title: felt252,
            _description: felt252,
            _pitch_video: felt252,
            _image: felt252,
            _target: u256,
            _deadline: u64
        ) -> u256 {
            assert(_deadline > get_block_timestamp(), 'Future deadline required');
            
            let startup_id = self.number_of_startups.read();
            
            let startup = Startup {
                owner: _owner,
                title: _title,
                description: _description,
                pitch_video: _pitch_video,
                image: _image,
                target: _target,
                deadline: _deadline,
                amount_collected: 0.into(),
                amount_released: 0.into(),
                is_verified: false,
            };
            
            self.startups.write(startup_id, startup);
            self.number_of_startups.write(startup_id + 1.into());
            
            // Emit event
            self.emit(StartupCreated { 
                id: startup_id, 
                owner: _owner, 
                title: _title, 
                target: _target, 
                deadline: _deadline 
            });
            
            return startup_id;
        }
        
        fn verify_startup(ref self: ContractState, _id: u256) {
            let verifier = self.verifier.read();
            assert(get_caller_address() == verifier, 'Only verifier');
            
            let mut startup = self.startups.read(_id);
            startup.is_verified = true;
            self.startups.write(_id, startup);
            
            // Emit event
            self.emit(StartupVerified { 
                id: _id, 
                verifier: verifier 
            });
        }
        
        // Document management functions
        fn add_startup_document(
            ref self: ContractState,
            _id: u256,
            _ipfs_hash: felt252,
            _document_type: felt252
        ) {
            let startup = self.startups.read(_id);
            let caller = get_caller_address();
            
            assert(
                caller == startup.owner || caller == self.verifier.read(),
                'Only owner or verifier'
            );
            
            let new_document = Document {
                ipfs_hash: _ipfs_hash,
                document_type: _document_type,
                timestamp: get_block_timestamp(),
            };
            
            // Get current document count
            let doc_count = self.documents_count.read(_id);
            
            // Store the new document
            self.documents.write((_id, doc_count), new_document);
            
            // Increment document count
            self.documents_count.write(_id, doc_count + 1);
            
            // Emit event
            self.emit(DocumentAdded { 
                startup_id: _id, 
                ipfs_hash: _ipfs_hash, 
                document_type: _document_type 
            });
        }
        
        fn get_startup_documents(
            self: @ContractState,
            _id: u256
        ) -> Array<Document> {
            let doc_count = self.documents_count.read(_id);
            let mut documents: Array<Document> = ArrayTrait::new();
            
            let mut i: u32 = 0;
            while i < doc_count {
                let doc = self.documents.read((_id, i));
                documents.append(doc);
                i += 1;
            }
            
            return documents;
        }
        
        // Milestone management functions
        fn add_startup_milestone(
            ref self: ContractState,
            _id: u256,
            _title: felt252,
            _description: felt252,
            _fund_amount: u256
        ) {
            let startup = self.startups.read(_id);
            assert(get_caller_address() == startup.owner, 'Only owner can add');
            
            // Calculate total milestone funds
            let milestone_count = self.milestones_count.read(_id);
            let mut total_milestone_funds = 0.into();
            
            let mut i: u32 = 0;
            while i < milestone_count {
                let milestone = self.milestones.read((_id, i));
                total_milestone_funds += milestone.fund_amount;
                i += 1;
            }
            
            assert(
                total_milestone_funds + _fund_amount <= startup.amount_collected,
                'Not enough funds'
            );
            
            let new_milestone = Milestone {
                title: _title,
                description: _description,
                fund_amount: _fund_amount,
                is_completed: false,
                ipfs_hash: 0, // Empty string
                completion_timestamp: 0,
            };
            
            // Store the new milestone
            self.milestones.write((_id, milestone_count), new_milestone);
            
            // Increment milestone count
            self.milestones_count.write(_id, milestone_count + 1);
            
            // Emit event
            self.emit(MilestoneAdded { 
                startup_id: _id, 
                title: _title, 
                fund_amount: _fund_amount 
            });
        }
        
        fn complete_milestone(
            ref self: ContractState,
            _startup_id: u256,
            _milestone_id: u256,
            _proof_ipfs_hash: felt252
        ) {
            assert(get_caller_address() == self.verifier.read(), 'Only verifier');
            
            let startup = self.startups.read(_startup_id);
            let milestone_count = self.milestones_count.read(_startup_id);
            
            // Convert u256 to u32 for array access
            let milestone_id_u32: u32 = _milestone_id.try_into().unwrap();
            
            assert(_milestone_id < milestone_count.into(), 'Invalid milestone ID');
            
            let milestone = self.milestones.read((_startup_id, milestone_id_u32));
            assert(!milestone.is_completed, 'Already completed');
            
            // Update milestone
            let mut updated_milestone = milestone;
            updated_milestone.is_completed = true;
            updated_milestone.ipfs_hash = _proof_ipfs_hash;
            updated_milestone.completion_timestamp = get_block_timestamp();
            
            self.milestones.write((_startup_id, milestone_id_u32), updated_milestone);
            
            // Update startup released amount
            let mut updated_startup = startup;
            updated_startup.amount_released += milestone.fund_amount;
            self.startups.write(_startup_id, updated_startup);
            
            // Transfer funds to the startup owner
            let payload = array![startup.owner.into(), milestone.fund_amount.low.into(), milestone.fund_amount.high.into()];
            send_message_to_l1_syscall(payload.span()).unwrap_syscall();
            
            // Emit event
            self.emit(MilestoneCompleted { 
                startup_id: _startup_id, 
                milestone_id: _milestone_id, 
                proof_ipfs_hash: _proof_ipfs_hash,
                fund_amount: milestone.fund_amount
            });
        }
        
        fn get_startup_milestones(
            self: @ContractState,
            _id: u256
        ) -> Array<Milestone> {
            let milestone_count = self.milestones_count.read(_id);
            let mut milestones: Array<Milestone> = ArrayTrait::new();
            
            let mut i: u32 = 0;
            while i < milestone_count {
                let milestone = self.milestones.read((_id, i));
                milestones.append(milestone);
                i += 1;
            }
            
            return milestones;
        }
        
        // Funding functions
        fn fund_startup(ref self: ContractState, _id: u256, _amount: u256) {
            // Use the parameter amount
            let amount = _amount;
            
            // Get the startup
            let mut startup = self.startups.read(_id);
            
            // Check if the startup is verified
            assert(startup.is_verified, 'Startup not verified');
            
            // Check if the funding period is still active
            assert(get_block_timestamp() < startup.deadline, 'Funding period ended');
            
            // Get the investor address
            let investor = get_caller_address();
            
            // Create a new funder record
            let token_id = self._next_token_id.read();
            self._next_token_id.write(token_id + 1.into());
            
            let new_funder = Funder {
                funder_address: investor,
                amount: amount,
                token_id: token_id,
            };
            
            // Update investor's total amount for this startup
            let current_amount = self.investor_total_amount.read((investor, _id));
            self.investor_total_amount.write((investor, _id), current_amount + amount);
            
            // Add funder to the startup's funders list
            let funder_count = self.funders_count.read(_id);
            self.funders.write((_id, funder_count), new_funder);
            self.funders_count.write(_id, funder_count + 1);
            
            // Update startup's collected amount
            startup.amount_collected += amount;
            self.startups.write(_id, startup);
            
            // Emit event
            self.emit(StartupFunded { 
                startup_id: _id, 
                investor: investor, 
                amount: amount, 
                token_id: token_id 
            });
        }
        
        fn withdraw_funds(ref self: ContractState, _id: u256) {
            // Get the startup
            let startup = self.startups.read(_id);
            
            // Check if the caller is the startup owner
            assert(get_caller_address() == startup.owner, 'Only owner can withdraw');
            
            // Check if the funding deadline has passed
            assert(get_block_timestamp() > startup.deadline, 'Cannot withdraw before deadline');
            
            // Check if the funding target was met
            assert(startup.amount_collected >= startup.target, 'Funding target not met');
            
            // Calculate available funds (collected minus already released)
            let available_funds = startup.amount_collected - startup.amount_released;
            assert(available_funds > 0, 'No funds available');
            
            // Update the startup's released amount
            let mut updated_startup = startup;
            updated_startup.amount_released += available_funds;
            self.startups.write(_id, updated_startup);
            
            // Transfer funds to the owner
            let payload = array![startup.owner.into(), available_funds.low.into(), available_funds.high.into()];
            send_message_to_l1_syscall(payload.span()).unwrap_syscall();
            
            // Emit event
            self.emit(FundsWithdrawn { 
                startup_id: _id, 
                owner: startup.owner, 
                amount: available_funds 
            });
        }
        
        fn get_funders(self: @ContractState, _id: u256) -> Array<Funder> {
            let funder_count = self.funders_count.read(_id);
            let mut funders: Array<Funder> = ArrayTrait::new();
            
            let mut i: u32 = 0;
            while i < funder_count {
                let funder = self.funders.read((_id, i));
                funders.append(funder);
                i += 1;
            }
            
            return funders;
        }
        
        fn get_investor_total_amount(
            self: @ContractState,
            _investor: ContractAddress,
            _startup_id: u256
        ) -> u256 {
            return self.investor_total_amount.read((_investor, _startup_id));
        }
        
        fn get_startup(self: @ContractState, _id: u256) -> Startup {
            return self.startups.read(_id);
        }
        
        fn get_all_startups(self: @ContractState) -> Array<Startup> {
            let num_startups = self.number_of_startups.read();
            let mut startups: Array<Startup> = ArrayTrait::new();
            
            let mut i: u256 = 0;
            while i < num_startups {
                let startup = self.startups.read(i);
                startups.append(startup);
                i += 1.into();
            }
            
            return startups;
        }
    }
}

