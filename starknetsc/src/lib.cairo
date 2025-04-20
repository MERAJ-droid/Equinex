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
        startup_is_verified: LegacyMap<felt252, bool>,
        
        // Funder tracking
        funder_amount: LegacyMap<(felt252, ContractAddress), felt252>,
        
        // Document tracking
        document_count: LegacyMap<felt252, felt252>,
        document_hash: LegacyMap<(felt252, felt252), felt252>,
        document_type: LegacyMap<(felt252, felt252), felt252>,
        
        // Verifier
        verifier: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        StartupCreated: StartupCreated,
        StartupFunded: StartupFunded,
        StartupVerified: StartupVerified,
        DocumentAdded: DocumentAdded,
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

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.startups_count.write(0);
        self.verifier.write(get_caller_address());
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
        self.startup_is_verified.write(id, false);
        self.document_count.write(id, 0);
        
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
}
