// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

/// @title Adventure Gold for Loot holders!
/// @author Will Papper <https://twitter.com/WillPapper>
/// @notice This contract mints Adventure Gold for Loot holders and provides
/// administrative functions to the Loot DAO. It allows:
/// * Loot holders to claim Adventure Gold
/// * A DAO to set seasons for new opportunities to claim Adventure Gold
/// * A DAO to mint Adventure Gold for use within the Loot ecosystem
/// @custom:unaudited This contract has not been audited. Use at your own risk.
contract AdventureGold is Context, Ownable, ERC20 {
    // Loot contract is available at https://etherscan.io/address/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7
    address public lootContractAddress =
        0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7;
    IERC721Enumerable public lootContract;

    // Give out 10,000 Adventure Gold for every Loot Bag that a user holds
    uint256 public adventureGoldPerTokenId = 10000 * (10**decimals());

    // tokenIdStart of 1 is based on the following lines in the Loot contract:
    /** 
    function claim(uint256 tokenId) public nonReentrant {
        require(tokenId > 0 && tokenId < 7778, "Token ID invalid");
        _safeMint(_msgSender(), tokenId);
    }
    */
    uint256 public tokenIdStart = 1;

    // tokenIdEnd of 8000 is based on the following lines in the Loot contract:
    /**
        function ownerClaim(uint256 tokenId) public nonReentrant onlyOwner {
        require(tokenId > 7777 && tokenId < 8001, "Token ID invalid");
        _safeMint(owner(), tokenId);
    }
    */
    uint256 public tokenIdEnd = 8000;

    // Seasons are used to allow users to claim tokens regularly. Seasons are
    // decided by the DAO.
    uint256 public season = 0;

    // Track claimed tokens within a season
    // IMPORTANT: The format of the mapping is:
    // claimedForSeason[season][tokenId][claimed]
    mapping(uint256 => mapping(uint256 => bool)) public seasonClaimedByTokenId;

    constructor() Ownable() ERC20("Adventure Gold", "AGLD") {
        // Transfer ownership to the Loot DAO
        // Ownable by OpenZeppelin automatically sets owner to msg.sender, but
        // we're going to be using a separate wallet for deployment
        transferOwnership(0xcD814C83198C15A542F9A13FAf84D518d1744ED1);
        lootContract = IERC721Enumerable(lootContractAddress);
    }

    /// @notice Claim Adventure Gold for a given Loot ID
    /// @param tokenId The tokenId of the Loot NFT
    function claimById(uint256 tokenId) public {
        // Follow the Checks-Effects-Interactions pattern to prevent reentrancy
        // attacks

        // Checks

        // Check that the msgSender owns the token that is being claimed
        require(
            _msgSender() == lootContract.ownerOf(tokenId),
            "MUST_OWN_TOKEN_ID"
        );

        // Further Checks, Effects, and Interactions are contained within the
        // _claim() function
        _claim(tokenId);
    }

    /// @notice Claim Adventure Gold for all tokens owned by the sender
    /// @notice This function will run out of gas if you have too much loot! If
    /// this is a concern, you should use claimRangeForOwner and claim Adventure
    /// Gold in batches.
    function claimAllForOwner() public {
        uint256 tokenBalanceOwner = lootContract.balanceOf(_msgSender());

        // Checks
        require(tokenBalanceOwner > 0, "NO_TOKENS_OWNED");

        for (uint256 i = 0; i < tokenBalanceOwner; i++) {
            // Further Checks, Effects, and Interactions are contained within
            // the _claim() function
            _claim(lootContract.tokenOfOwnerByIndex(_msgSender(), i));
        }
    }

    /// @notice Claim Adventure Gold for all tokens owned by the sender within a
    /// given range
    /// @notice This function is useful if you own too much Loot to claim all at
    /// once or if you want to leave some Loot unclaimed. If you leave Loot
    /// unclaimed, however, you cannot claim it once the next season starts.
    function claimRangeForOwner(uint256 ownerIndexStart, uint256 ownerIndexEnd)
        public
    {
        uint256 tokenBalanceOwner = lootContract.balanceOf(_msgSender());

        // Checks
        require(tokenBalanceOwner > 0, "NO_TOKENS_OWNED");

        // We use < for ownerIndexEnd and tokenBalanceOwner because
        // tokenOfOwnerByIndex is 0-indexed while the token balance is 1-indexed
        require(
            ownerIndexStart >= 0 && ownerIndexEnd < tokenBalanceOwner,
            "INDEX_OUT_OF_RANGE"
        );

        for (uint256 i = ownerIndexStart; i < ownerIndexEnd; i++) {
            // Further Checks, Effects, and Interactions are contained within
            // the _claim() function
            _claim(lootContract.tokenOfOwnerByIndex(_msgSender(), i));
        }
    }

    /// @dev Private function to mint Loot upon claiming
    function _claim(uint256 tokenId) internal {
        // Checks
        // Check that the token ID is in range
        require(
            tokenId >= tokenIdStart && tokenId <= tokenIdEnd,
            "TOKEN_ID_OUT_OF_RANGE"
        );

        // Check that Adventure Gold have not already been claimed this season
        // for a given tokenId
        require(
            !seasonClaimedByTokenId[season][tokenId],
            "GOLD_CLAIMED_FOR_TOKEN_ID"
        );

        // Effects

        // Mark that Adventure Gold has been claimed for this season for the
        // given tokenId
        seasonClaimedByTokenId[season][tokenId] = true;

        // Interactions

        // Send Adventure Gold to the owner of the token ID
        _mint(lootContract.ownerOf(tokenId), adventureGoldPerTokenId);
    }

    /// @notice Allows the DAO to mint new tokens for use within the Loot
    /// Ecosystem
    /// @param amountDisplayValue The amount of Loot to mint. This should be
    /// input as the display value, not in raw decimals. If you want to mint
    /// 100 Loot, you should enter "100" rather than the value of 100 * 10^18.
    function daoMint(uint256 amountDisplayValue) public onlyOwner {
        _mint(owner(), amountDisplayValue * (10**decimals()));
    }

    /// @notice Allows the DAO to set a new contract address for Loot. This is
    /// relevant in the event that Loot migrates to a new contract.
    /// @param lootContractAddress_ The new contract address for Loot
    function daoSetLootContractAddress(address lootContractAddress_)
        public
        onlyOwner
    {
        lootContractAddress = lootContractAddress_;
        lootContract = IERC721Enumerable(lootContractAddress);
    }

    /// @notice Allows the DAO to set the amount of Adventure Gold that is
    /// claimed per token ID
    /// @param adventureGoldDisplayValue The amount of Loot a user can claim.
    /// This should be input as the display value, not in raw decimals. If you
    /// want to mint 100 Loot, you should enter "100" rather than the value of
    /// 100 * 10^18.
    function daoSetAdventureGoldPerTokenId(uint256 adventureGoldDisplayValue)
        public
        onlyOwner
    {
        adventureGoldPerTokenId = adventureGoldDisplayValue * (10**decimals());
    }

    /// @notice Allows the DAO to set the token IDs that are eligible to claim
    /// Loot
    /// @param tokenIdStart_ The start of the eligible token range
    /// @param tokenIdEnd_ The end of the eligible token range
    /// @dev This is relevant in case a future Loot contract has a different
    /// total supply of Loot
    function daoSetTokenIdRange(uint256 tokenIdStart_, uint256 tokenIdEnd_)
        public
        onlyOwner
    {
        tokenIdStart = tokenIdStart_;
        tokenIdEnd = tokenIdEnd_;
    }

    /// @notice Allows the DAO to set a season for new Adventure Gold claims
    /// @param season_ The season to use for claiming Loot
    function daoSetSeason(uint256 season_) public onlyOwner {
        season = season_;
    }

    /// @notice Allows the DAO to set the season and Adventure Gold per token ID
    /// in one transaction. This ensures that there is not a gap where a user
    /// can claim more Adventure Gold than others
    /// @param season_ The season to use for claiming loot
    /// @param adventureGoldDisplayValue The amount of Loot a user can claim.
    /// This should be input as the display value, not in raw decimals. If you
    /// want to mint 100 Loot, you should enter "100" rather than the value of
    /// 100 * 10^18.
    /// @dev We would save a tiny amount of gas by modifying the season and
    /// adventureGold variables directly. It is better practice for security,
    /// however, to avoid repeating code. This function is so rarely used that
    /// it's not worth moving these values into their own internal function to
    /// skip the gas used on the modifier check.
    function daoSetSeasonAndAdventureGoldPerTokenID(
        uint256 season_,
        uint256 adventureGoldDisplayValue
    ) public onlyOwner {
        daoSetSeason(season_);
        daoSetAdventureGoldPerTokenId(adventureGoldDisplayValue);
    }
}
