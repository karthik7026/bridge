import React, { useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import ERC20_ABI from "./ERC20_ABI.json";
import ABI from "./abi.json";

const CONTRACT_ADDRESS = "0x377881A434c8C04F06862eF2Ca9555C2D33F9A2d";
const LINK_TOKEN_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
const TOKEN_ADDRESS = "0x71f53e4391b3fd59ac466d7d6ca3dd9334f9e6b9";
const ALCHEMY_API_URL =
  "https://eth-sepolia.g.alchemy.com/v2/3-CVSvwLf0zeQkyQ6kagd4qaZ77ciNxq";

const ConvertBridge = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [destinationAddressVisible, setDestinationAddressVisible] =
    useState(false);
  const [fromAmount, setFromAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  const toggleWalletModal = () => setShowWalletModal(!showWalletModal);
  const toggleFeeBreakdown = () => setShowFeeBreakdown(!showFeeBreakdown);
  const toggleTransactionHistory = () =>
    setShowTransactionHistory(!showTransactionHistory);
  const toggleDestinationField = () =>
    setDestinationAddressVisible(!destinationAddressVisible);

  const updateEstimatedFee = () => {
    // Logic for updating fee based on input amount
    console.log("Updating estimated fee");
  };

  const submitDestinationAddress = () => {
    // Simple validation for destination address
    if (!destinationAddress || !isValidAddress(destinationAddress)) {
      setAddressError("Please enter a valid destination address.");
    } else {
      setAddressError("");
      console.log("Submitting destination address:", destinationAddress);
      alert(`Destination Address Submitted: ${destinationAddress}`);
    }
  };

  const connectWallet = (walletType) => {
    if (walletType === "MetaMask") {
      if (window.ethereum) {
        window.ethereum
          .request({ method: "eth_requestAccounts" })
          .then((accounts) => {
            setWalletAddress(accounts[0]);
            setWalletConnected(true);
            setShowWalletModal(false);
            alert(`Wallet connected: ${accounts[0]}`);
          })
          .catch((err) => {
            console.error("Error connecting wallet:", err);
          });
      } else {
        alert(
          "MetaMask is not installed. Please install it from https://metamask.io/"
        );
      }
    } else {
      alert(`${walletType} is not supported yet. Please use MetaMask.`);
    }
  };

  const disconnectWallet = () => {
    console.log("Disconnecting wallet");
    setWalletConnected(false);
    setWalletAddress("");
  };

  const isValidAddress = (address) => {
    // Add a simple address validation (Ethereum address format)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleTransfer = async () => {
    if (!walletConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!destinationAddress || !fromAmount) {
      alert("Please provide a valid destination address and amount.");
      return;
    }

    // setIsLoading(true);

    try {
      const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);
      const signer = provider.getSigner(walletAddress);
      const wallet = new ethers.Wallet(signer.privateKey, provider); // Assuming privateKey access is configured
      const linkTokenContract = new ethers.Contract(
        LINK_TOKEN_ADDRESS,
        ERC20_ABI,
        wallet
      );
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        ERC20_ABI,
        wallet
      );
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

      const amount = ethers.parseUnits(fromAmount, 18); // Adjust decimals based on your token
      const fees = ethers.parseUnits("1", 18); // Replace with calculated LINK fees
      const destinationChainSelector = 13264668187771770619; // Replace as needed

      // Step 1: Approve LINK token for fees
      console.log("Approving LINK token...");
      const linkApprovalTx = await linkTokenContract.approve(
        CONTRACT_ADDRESS,
        fees
      );
      await linkApprovalTx.wait();
      console.log("LINK token approved.");

      // Step 2: Approve TOKEN for transfer
      console.log("Approving TOKEN for transfer...");
      const tokenApprovalTx = await tokenContract.approve(
        CONTRACT_ADDRESS,
        amount
      );
      await tokenApprovalTx.wait();
      console.log("TOKEN approved.");

      // Step 3: Transfer tokens
      console.log("Transferring tokens...");
      const transferTx = await contract.transferTokensPayLINK(
        destinationChainSelector,
        destinationAddress,
        TOKEN_ADDRESS,
        amount
      );
      const receipt = await transferTx.wait();
      console.log(
        "Tokens transferred. Transaction hash:",
        receipt.transactionHash
      );

      alert("Tokens transferred successfully!");
    } catch (error) {
      console.error("Error during transfer:", error);
      alert("Transaction failed. Check the console for details.");
    } finally {
      // setIsLoading(false);
    }
  };

  return (
    <div className="bridge-container">
      <h1>Convert/Bridge Tokens</h1>
      <div id="wallet-balance" style={{ marginTop: "10px" }}>
        Balance:{" "}
      </div>
      <div
        id="estimated-fee"
        style={{ marginTop: "10px", cursor: "pointer" }}
        onClick={toggleFeeBreakdown}
      >
        Estimated Fee:
      </div>

      <div className="convert-card">
        <div className="convert-section">
          <label htmlFor="from-token">From</label>
          <select id="from-network">
            <option value="binance">Sepolia</option>
          </select>
          <input
            type="text"
            id="from-amount"
            placeholder="Amount"
            value={fromAmount}
            onChange={(e) => {
              setFromAmount(e.target.value);
              updateEstimatedFee();
            }}
          />
          <select id="from-token">
            <option value="ath"></option>
          </select>
        </div>

        <div className="convert-arrow">
          <button id="convert-direction">⬇️</button>
        </div>

        <div className="convert-section">
          <label htmlFor="to-network">To</label>
          <select id="to-network">
            <option value="binance">Binance Smart Chain</option>
          </select>
        </div>

        {/* Destination Address Section */}
        <div className="destination-section">
          <button id="add-destination" onClick={toggleDestinationField}>
            Add Destination Address
          </button>

          {/* Check for visibility of destination address input */}
          {destinationAddressVisible && (
            <div>
              <input
                style={{
                  backgroundColor: "white",
                }}
                type="text"
                id="destination-address"
                placeholder="Enter destination address"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
              />
              {/* Display error message if address is invalid */}
              {addressError && (
                <div style={{ color: "red" }}>{addressError}</div>
              )}
              {/* Submit button should appear only if there is input */}
              {destinationAddress && (
                <button
                  id="submit-destination"
                  onClick={submitDestinationAddress}
                >
                  Submit Destination
                </button>
              )}
            </div>
          )}

          <button
            id="transaction-history-icon"
            onClick={toggleTransactionHistory}
          >
            📝 Transaction History
          </button>
        </div>
      </div>

      <div
        id="wallet-buttons"
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        {!walletConnected ? (
          <button id="connect-wallet" onClick={toggleWalletModal}>
            Connect Wallet
          </button>
        ) : (
          <>
            <button id="connected-wallet">Connected: {walletAddress}</button>
            <button id="disconnect-wallet" onClick={disconnectWallet}>
              Disconnect Wallet
            </button>
          </>
        )}

        <button id="convert-tokens" onClick={handleTransfer}>
          Convert
        </button>

        <button id="convert-tokens-2">
          <span
            className="info-icon"
            title="Here is some random information about the token conversion process. Please read the instructions carefully."
          ></span>
          Convert
          <span className="random-info">(Pay Gas Fee)</span>
        </button>
      </div>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div id="wallet-modal" className="modal">
          <div className="modal-content">
            <span className="close" onClick={toggleWalletModal}>
              &times;
            </span>
            <h2
              style={{
                color: "black",
              }}
            >
              Select a Wallet
            </h2>
            <ul>
              <li>
                <button onClick={() => connectWallet("MetaMask")}>
                  MetaMask
                </button>
              </li>
              <li>
                <button onClick={() => connectWallet("WalletConnect")}>
                  WalletConnect
                </button>
              </li>
              <li>
                <button onClick={() => connectWallet("Coinbase Wallet")}>
                  Coinbase Wallet
                </button>
              </li>
              <li>
                <button onClick={() => connectWallet("Fortmatic")}>
                  Fortmatic
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionHistory && (
        <div id="transaction-history-modal" className="modal">
          <div className="modal-content">
            <span className="close" onClick={toggleTransactionHistory}>
              &times;
            </span>
            <h2>Transaction History</h2>
            <div id="transaction-history-list"></div>
            <div id="no-transactions-message" style={{ display: "none" }}>
              No transactions found.
            </div>
          </div>
        </div>
      )}

      {/* Fee Breakdown Modal */}
      {showFeeBreakdown && (
        <div id="fee-breakdown-modal" className="modal">
          <div className="modal-content">
            <span className="close" onClick={toggleFeeBreakdown}>
              &times;
            </span>
            <h2>Fee Breakdown</h2>
            <p>
              <strong>Source Network:</strong> Binance Smart Chain
            </p>
            <p>
              <strong>Destination Network:</strong> Binance Smart Chain
            </p>
            <h3>Fees</h3>
            <ul>
              <li>
                <strong>Cross-Chain Gas Fee:</strong> 0.00015 BNB (~$0.25)
              </li>
              <li>
                <strong>Platform Fee:</strong> 0.1% of the transaction amount
              </li>
              <li>
                <strong>Additional Network Fee:</strong> 0.00005 BNB (~$0.08)
              </li>
            </ul>
            <h3>Estimated Total</h3>
            <p>
              <strong>Total Fee:</strong> 0.0002 BNB (~$0.33)
            </p>
            <p>
              Note: Gas fees may vary based on network congestion at the time of
              the transaction.
            </p>
            <h3>Important Information</h3>
            <p>
              If market prices fluctuate significantly, the transaction may
              fail, and funds will be returned to your wallet as the native
              token (e.g., BNB on the destination chain).
            </p>
            <p>
              Ensure sufficient balance to cover the fees before proceeding with
              the transaction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvertBridge;
