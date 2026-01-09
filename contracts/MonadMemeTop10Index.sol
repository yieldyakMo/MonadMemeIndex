// SPDX-License-Identifier: MIT
// Monad Meme Top 10 Index (TOP10)
// Deployed & immutable on Monad
// This source matches the on-chain bytecode
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * Monad Meme Top 10 Index
 *
 * - Immutable basket (hardcoded)
 * - No owner
 * - One-time seeding
 * - Permissionless mint/redeem forever
 */
contract MonadMemeTop10Index is ERC20, ERC20Permit, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Constituent {
        IERC20 token;
    }

    /// @notice Address allowed to seed the vault exactly once
    address public immutable SEEDER;

    /// @notice Fixed basket of 10 meme tokens
    Constituent[10] public constituents;

    bool public seeded;

    event Seeded(address indexed seeder, uint256 shares, uint256[10] seedAmounts);
    event Minted(address indexed user, uint256 shares, uint256[10] amountsIn);
    event Redeemed(address indexed user, uint256 shares, uint256[10] amountsOut);

    constructor(address seeder_)
        ERC20("Monad Meme Top 10 Index", "TOP10")
        ERC20Permit("Monad Meme Top 10 Index")
    {
        require(seeder_ != address(0), "seeder=0");
        SEEDER = seeder_;

        // ✅ Checksummed immutable basket (ORDER MATTERS)
        constituents[0] = Constituent(IERC20(0x81A224F8A62f52BdE942dBF23A56df77A10b7777)); // EMONAD
        constituents[1] = Constituent(IERC20(0xc09C8242Eb21B24298303799Bb5Af402A2957777)); // PEPE
        constituents[2] = Constituent(IERC20(0x7DB552eEb6b77a6babe6e0A739b5382CD653CC3e)); // GMONAD
        constituents[3] = Constituent(IERC20(0xA7b3F394B9AAbA67f2543a8c1A0F753cC68d7777)); // GONAD
        constituents[4] = Constituent(IERC20(0x788571E0E5067Adea87e6BA22a2b738fFDf48888)); // UNIT
        constituents[5] = Constituent(IERC20(0xB744F5CDb792d8187640214C4A1c9aCE29af7777)); // MOONSHI
        constituents[6] = Constituent(IERC20(0x81D61e48BCe95aB2Cd16Ced67B8d4aaf682B8350)); // BURNBANK
        constituents[7] = Constituent(IERC20(0x7131ECA3401F58371cfb4c3b27aA07837cF77777)); // LISA
        constituents[8] = Constituent(IERC20(0x350035555E10d9AfAF1566AaebfCeD5BA6C27777)); // CHOG
        constituents[9] = Constituent(IERC20(0x42a4aA89864A794dE135B23C6a8D2E05513d7777)); // SHRAMP
    }
    // -----------------------
    // Views
    // -----------------------

    function basketBalances() public view returns (uint256[10] memory bals) {
        for (uint256 i = 0; i < 10; i++) {
            bals[i] = constituents[i].token.balanceOf(address(this));
        }
    }

    function quoteMint(uint256 shares) external view returns (uint256[10] memory amountsIn) {
        require(seeded, "not seeded");
        require(shares > 0, "shares=0");

        uint256 supply = totalSupply();
        uint256[10] memory bals = basketBalances();

        for (uint256 i = 0; i < 10; i++) {
            amountsIn[i] = (bals[i] * shares) / supply;
        }
    }

    function quoteRedeem(uint256 shares) external view returns (uint256[10] memory amountsOut) {
        require(seeded, "not seeded");
        require(shares > 0, "shares=0");

        uint256 supply = totalSupply();
        uint256[10] memory bals = basketBalances();

        for (uint256 i = 0; i < 10; i++) {
            amountsOut[i] = (bals[i] * shares) / supply;
        }
    }

    // -----------------------
    // One-time seed
    // -----------------------

    function mintInitial(uint256 shares, uint256[10] calldata seedAmounts)
        external
        nonReentrant
    {
        require(!seeded, "already seeded");
        require(msg.sender == SEEDER, "not seeder");
        require(shares > 0, "shares=0");

        for (uint256 i = 0; i < 10; i++) {
            require(seedAmounts[i] > 0, "seed=0");
            constituents[i].token.safeTransferFrom(
                msg.sender,
                address(this),
                seedAmounts[i]
            );
        }

        seeded = true;
        _mint(msg.sender, shares);

        emit Seeded(msg.sender, shares, seedAmounts);
    }

    // -----------------------
    // Permissionless mint
    // -----------------------

    function mint(uint256 shares, uint256[10] calldata maxAmountsIn)
        external
        nonReentrant
    {
        require(seeded, "not seeded");
        require(shares > 0, "shares=0");

        uint256 supply = totalSupply();
        uint256[10] memory bals = basketBalances();
        uint256[10] memory amountsIn;

        for (uint256 i = 0; i < 10; i++) {
            uint256 req = (bals[i] * shares) / supply;
            require(req <= maxAmountsIn[i], "slippage");
            amountsIn[i] = req;
        }

        for (uint256 i = 0; i < 10; i++) {
            if (amountsIn[i] > 0) {
                constituents[i].token.safeTransferFrom(
                    msg.sender,
                    address(this),
                    amountsIn[i]
                );
            }
        }

        _mint(msg.sender, shares);
        emit Minted(msg.sender, shares, amountsIn);
    }

    // -----------------------
    // Permissionless redeem
    // -----------------------

    function redeem(uint256 shares, uint256[10] calldata minAmountsOut)
        external
        nonReentrant
    {
        require(seeded, "not seeded");
        require(shares > 0, "shares=0");

        uint256 supply = totalSupply();
        uint256[10] memory bals = basketBalances();
        uint256[10] memory amountsOut;

        for (uint256 i = 0; i < 10; i++) {
            uint256 outAmt = (bals[i] * shares) / supply;
            require(outAmt >= minAmountsOut[i], "slippage");
            amountsOut[i] = outAmt;
        }

        _burn(msg.sender, shares);

        for (uint256 i = 0; i < 10; i++) {
            if (amountsOut[i] > 0) {
                constituents[i].token.safeTransfer(
                    msg.sender,
                    amountsOut[i]
                );
            }
        }

        emit Redeemed(msg.sender, shares, amountsOut);
    }
}

