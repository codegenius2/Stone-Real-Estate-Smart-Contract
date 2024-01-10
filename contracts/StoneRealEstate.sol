// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./erc721a/contracts/extensions/ERC721AQueryable.sol";
import "../node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

error NotAdminOrOwner();
error AlreadyAdmin();
error AlreadyWhitelisted();
error EmptyArray();
error WalletNotWhitelisted();
error WalletNotAdmin();
error PriceMustBeGreaterThan0();
error PriceIsSameAsCurrent();
error TransferFeesMustBeGreaterThan0();
error TransferFeesIsSameAsCurrent();
error ShouldBeAValidAddress();
error ShouldBeADifferentAddressThanCurrent();
error NotEnoughUSDCAllowed();
error NotEnoughUSDCInBalance();
error CallerIsNotWhitelisted();
error ShouldBeAValidQuantity();
error MaxSupplyReachedOrTooMuchNftsAsked();
error CannotComputeTotalPrice();
error NoNftMintedSoNothingToSend();
error CannotCompute();
error MintFeesMustBeGreaterThan0();
error MintFeesIsSameAsCurrent();

contract StoneRealEstate is ERC721AQueryable, ReentrancyGuard, Ownable {
    string internal uri;

    uint256 public price;
    uint256 public transferFees;
    uint256 public mintFees;
    uint256 public immutable maxSupply;

    address public ownerFundReceiptWallet;

    address[] internal whitelist;

    IERC20 public usdcAddress;

    mapping(address => bool) public isWhitelist;
    mapping(address => bool) public isAdmin;

    event AddToAdmin(address indexed newAdmin);
    event AddedToWhitelist(address indexed newWhitelistedWallet);
    event RemovedFromWhitelist(address indexed removedWhitelistedWallet);
    event RemovedFromAdmin(address indexed oldAdmin);
    event SetNewPrice(uint256 indexed newPrice);
    event SetNewTransferFees(uint256 indexed newTransferFees);
    event SetNewMintFees(uint256 indexed newMintFees);
    event SetNewOwnerFundReceiptWallet(
        address indexed newOwnerFundReceiptWallet
    );
    event SetNewUsdcAddress(address indexed newUsdcAddress);
    event CustomTransferFrom(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        uint256 transferFees,
        address ownerFundReceiptWallet
    );
    event Mint(
        address indexed minter,
        address indexed receiver,
        uint256 quantity,
        uint256 totalPrice,
        uint256 totalMintFees,
        uint256 indexed firstTokenIdMinted
    );
    event SendYield(
        address indexed to,
        uint256 indexed totalRentAmount,
        uint256 currentYieldSendForToWallet
    );

    constructor(
        address _usdcAddress,
        address _ownerFundReceiptWallet,
        uint256 _price,
        uint256 _transferFees,
        uint256 _mintFees,
        uint256 _maxSupply,
        string memory _uri,
        string memory _collectionName,
        string memory _collectionSymbol
    ) ERC721A(_collectionName, _collectionSymbol) {
        usdcAddress = IERC20(_usdcAddress);
        ownerFundReceiptWallet = _ownerFundReceiptWallet;
        price = _price;
        transferFees = _transferFees;
        mintFees = _mintFees;
        maxSupply = _maxSupply;
        uri = _uri;
    }

    modifier onlyAdminOrOwner() {
        if (msg.sender != owner()) {
            if (!isAdmin[msg.sender]) revert NotAdminOrOwner();
        }
        _;
    }
    modifier onlyWhitelist(address _addressToBeChecked) {
        if (!isWhitelist[_addressToBeChecked]) {
            revert WalletNotWhitelisted();
        }
        _;
    }

    function getAllWhitelistedAddress() public view returns (address[] memory) {
        return whitelist;
    }

    function addToWhitelist(
        address _newWhitelistedWallet
    ) external onlyAdminOrOwner {
        if (isWhitelist[_newWhitelistedWallet] == true)
            revert AlreadyWhitelisted();
        isWhitelist[_newWhitelistedWallet] = true;
        // for (uint256 i = 0; i < whitelist.length; i++) {
        //     if(whitelist[i] == _newWhitelistedWallet){
        //         revert AlreadyWhitelisted();
        //     }
        // }
        whitelist.push(_newWhitelistedWallet);
        emit AddedToWhitelist(_newWhitelistedWallet);
    }

    function addMultipleToWhitelist(
        address[] memory _newWhitelistedWalletArray
    ) external onlyAdminOrOwner {
        if (_newWhitelistedWalletArray.length == 0) revert EmptyArray();
        for (uint256 i = 0; i < _newWhitelistedWalletArray.length; i++) {
            if (isWhitelist[_newWhitelistedWalletArray[i]] == false) {
                isWhitelist[_newWhitelistedWalletArray[i]] = true;
                whitelist.push(_newWhitelistedWalletArray[i]);
                emit AddedToWhitelist(_newWhitelistedWalletArray[i]);
            }
        }
    }

    function removeFromWhitelist(
        address _oldWhitelistedWallet
    ) external onlyAdminOrOwner {
        if (isWhitelist[_oldWhitelistedWallet] == false)
            revert WalletNotWhitelisted();

        for (uint256 i = 0; i < whitelist.length; i++) {
            if (whitelist[i] == _oldWhitelistedWallet) {
                whitelist[i] = address(0);
                break;
            }
        }
        isWhitelist[_oldWhitelistedWallet] = false;
        emit RemovedFromWhitelist(_oldWhitelistedWallet);
    }

    function addToAdmin(address _newAdmin) external onlyOwner {
        if (isAdmin[_newAdmin] == true) revert AlreadyAdmin();
        isAdmin[_newAdmin] = true;
        emit AddToAdmin(_newAdmin);
    }

    function removeFromAdmin(address _oldAdmin) external onlyOwner {
        if (isAdmin[_oldAdmin] == false) revert WalletNotAdmin();
        isAdmin[_oldAdmin] = false;
        emit RemovedFromAdmin(_oldAdmin);
    }

    function setPrice(uint256 _newPrice) external onlyAdminOrOwner {
        if (_newPrice == 0) revert PriceMustBeGreaterThan0();
        if (_newPrice == price) revert PriceIsSameAsCurrent();

        price = _newPrice;
        emit SetNewPrice(_newPrice);
    }

    function setMintFees(uint _mintFees) external onlyAdminOrOwner {
        if (_mintFees == 0) revert MintFeesMustBeGreaterThan0();
        if (_mintFees == mintFees) revert MintFeesIsSameAsCurrent();
        mintFees = _mintFees;
        emit SetNewMintFees(_mintFees);
    }

    function setTransferFees(
        uint256 _newTransferFees
    ) external onlyAdminOrOwner {
        if (_newTransferFees == 0) revert TransferFeesMustBeGreaterThan0();
        if (_newTransferFees == transferFees)
            revert TransferFeesIsSameAsCurrent();

        transferFees = _newTransferFees;
        emit SetNewTransferFees(_newTransferFees);
    }

    function setOwnerFundReceiptWallet(
        address _newOwnerFundReceiptWallet
    ) external onlyOwner {
        if (_newOwnerFundReceiptWallet == address(0)) {
            revert ShouldBeAValidAddress();
        }

        if (_newOwnerFundReceiptWallet == ownerFundReceiptWallet) {
            revert ShouldBeADifferentAddressThanCurrent();
        }

        ownerFundReceiptWallet = _newOwnerFundReceiptWallet;
        emit SetNewOwnerFundReceiptWallet(_newOwnerFundReceiptWallet);
    }

    function setUsdcAddress(address _newUsdcAddress) external onlyOwner {
        if (_newUsdcAddress == address(0)) {
            revert ShouldBeAValidAddress();
        }

        if (IERC20(_newUsdcAddress) == usdcAddress) {
            revert ShouldBeADifferentAddressThanCurrent();
        }

        usdcAddress = IERC20(_newUsdcAddress);
        emit SetNewUsdcAddress(_newUsdcAddress);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        public
        payable
        override(ERC721A, IERC721A)
        nonReentrant
        onlyWhitelist(to)
    {
        if (usdcAddress.allowance(msg.sender, address(this)) < transferFees)
            revert NotEnoughUSDCAllowed();
        if (usdcAddress.balanceOf(msg.sender) < transferFees)
            revert NotEnoughUSDCInBalance();

        bool success = usdcAddress.transferFrom(
            msg.sender,
            address(this),
            transferFees
        );
        require(success, "USDCTransferFailed");

        bool success2 = usdcAddress.transfer(
            ownerFundReceiptWallet,
            transferFees
        );
        require(success2, "USDCTransferFailed");

        uint256 prevOwnershipPacked = _packedOwnershipOf(tokenId);

        if (address(uint160(prevOwnershipPacked)) != from)
            revert TransferFromIncorrectOwner();

        (
            uint256 approvedAddressSlot,
            address approvedAddress
        ) = _getApprovedSlotAndAddress(tokenId);

        // The nested ifs save around 20+ gas over a compound boolean condition.
        if (
            !_isSenderApprovedOrOwner(
                approvedAddress,
                from,
                _msgSenderERC721A()
            )
        )
            if (!isApprovedForAll(from, _msgSenderERC721A()))
                revert TransferCallerNotOwnerNorApproved();

        if (to == address(0)) revert TransferToZeroAddress();

        _beforeTokenTransfers(from, to, tokenId, 1);

        // Clear approvals from the previous owner.
        assembly {
            if approvedAddress {
                // This is equivalent to `delete _tokenApprovals[tokenId]`.
                sstore(approvedAddressSlot, 0)
            }
        }

        // Underflow of the sender's balance is impossible because we check for
        // ownership above and the recipient's balance can't realistically overflow.
        // Counter overflow is incredibly unrealistic as `tokenId` would have to be 2**256.
        unchecked {
            // We can directly increment and decrement the balances.
            --_packedAddressData[from]; // Updates: `balance -= 1`.
            ++_packedAddressData[to]; // Updates: `balance += 1`.

            // Updates:
            // - `address` to the next owner.
            // - `startTimestamp` to the timestamp of transfering.
            // - `burned` to `false`.
            // - `nextInitialized` to `true`.
            _packedOwnerships[tokenId] = _packOwnershipData(
                to,
                _BITMASK_NEXT_INITIALIZED |
                    _nextExtraData(from, to, prevOwnershipPacked)
            );

            // If the next slot may not have been initialized (i.e. `nextInitialized == false`) .
            if (prevOwnershipPacked & _BITMASK_NEXT_INITIALIZED == 0) {
                uint256 nextTokenId = tokenId + 1;
                // If the next slot's address is zero and not burned (i.e. packed value is zero).
                if (_packedOwnerships[nextTokenId] == 0) {
                    // If the next slot is within bounds.
                    if (nextTokenId != _currentIndex) {
                        // Initialize the next slot to maintain correctness for `ownerOf(tokenId + 1)`.
                        _packedOwnerships[nextTokenId] = prevOwnershipPacked;
                    }
                }
            }
        }

        emit Transfer(from, to, tokenId);
        _afterTokenTransfers(from, to, tokenId, 1);

        emit CustomTransferFrom(
            from,
            to,
            tokenId,
            transferFees,
            ownerFundReceiptWallet
        );
    }

    function mint(
        address _to,
        uint256 _quantity
    ) external nonReentrant onlyWhitelist(_to) {
        if (!isWhitelist[msg.sender]) revert CallerIsNotWhitelisted();
        if (_to == address(0)) revert ShouldBeAValidAddress();
        if (_quantity == 0) revert ShouldBeAValidQuantity();
        uint256 nextTokenId = _nextTokenId();
        if (_quantity + nextTokenId > maxSupply)
            revert MaxSupplyReachedOrTooMuchNftsAsked();
        (bool status, uint256 _tempTotalPrice) = SafeMath.tryMul(
            price,
            _quantity
        );
        if (status == false) revert CannotComputeTotalPrice();
        (bool status2, uint256 _tempTotalFees) = SafeMath.tryMul(
            mintFees,
            _quantity
        );
        if (status2 == false) revert CannotComputeTotalPrice();
        (bool status3, uint256 _totalPrice) = SafeMath.tryAdd(
            _tempTotalPrice,
            _tempTotalFees
        );
        if (status3 == false) revert CannotComputeTotalPrice();
        if (usdcAddress.allowance(msg.sender, address(this)) < _totalPrice)
            revert NotEnoughUSDCAllowed();
        if (usdcAddress.balanceOf(msg.sender) < _totalPrice)
            revert NotEnoughUSDCInBalance();

        bool success = usdcAddress.transferFrom(
            msg.sender,
            address(this),
            _totalPrice
        );
        require(success, "USDCTransferFailed");

        bool success2 = usdcAddress.transfer(
            ownerFundReceiptWallet,
            _totalPrice
        );
        require(success2, "USDCTransferFailed");
        _mint(_to, _quantity);
        emit Mint(
            msg.sender,
            _to,
            _quantity,
            _totalPrice,
            _tempTotalFees,
            nextTokenId
        );
    }

    function sendYield(uint256 _amount) external nonReentrant onlyOwner {
        if (whitelist.length == 0) {
            revert EmptyArray();
        }
        if (usdcAddress.allowance(msg.sender, address(this)) < _amount) {
            revert NotEnoughUSDCAllowed();
        }
        if (usdcAddress.balanceOf(msg.sender) < _amount) {
            revert NotEnoughUSDCInBalance();
        }
        uint256 _total = totalSupply();
        if (_total == 0) {
            revert NoNftMintedSoNothingToSend();
        }

        bool success = usdcAddress.transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(success, "USDCTransferFailed");

        uint256 _remainder = _amount;
        for (uint256 i = 0; i < whitelist.length; i++) {
            if (whitelist[i] != address(0)) {
                uint256 _currentWalletBalance = balanceOf(whitelist[i]);
                (bool multStatus, uint256 _temp) = SafeMath.tryMul(
                    _amount,
                    _currentWalletBalance
                );
                if (multStatus == false) revert CannotCompute();
                (bool status, uint256 _currentWalletYield) = SafeMath.tryDiv(
                    _temp,
                    maxSupply
                );
                if (status == false) revert CannotCompute();

                bool success2 = usdcAddress.transfer(
                    whitelist[i],
                    _currentWalletYield
                );
                require(success2, "USDCTransferFailed");
                (, uint256 _newRemainder) = SafeMath.trySub(
                    _remainder,
                    _currentWalletYield
                );
                _remainder = _newRemainder;
                emit SendYield(whitelist[i], _amount, _currentWalletYield);
            }
        }

        if (_remainder > 0) {
            bool successRemainder = usdcAddress.transfer(
                msg.sender,
                _remainder
            );
            require(successRemainder, "USDCTransferFailed");
        }
    }

    /**
     * @dev set a new base uri.
     * example : https://website.com/ipfs/CID/
     */
    function setBaseURI(string memory _uri) external onlyAdminOrOwner {
        require(
            keccak256(abi.encodePacked(_uri)) !=
                keccak256(abi.encodePacked(uri)),
            "The URI is already set to the exact same URI !"
        );
        uri = _uri;
    }

    /**
     * @dev see chiru-labs ERC721A documentation
     */
    function _baseURI() internal view override returns (string memory) {
        return uri;
    }

    function getBaseURI() public view returns (string memory) {
        return _baseURI();
    }

    /**
     * @dev return the tokenURI of a NFT
     *
     * Requirements:
     *
     * - Cannot get the URI of unexistent tokenID.
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721A, IERC721A) returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length != 0
                ? string(abi.encodePacked(baseURI, _toString(tokenId), ".json"))
                : "";
    }
}
