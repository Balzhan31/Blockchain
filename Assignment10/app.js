// -------------------- Local Game Score --------------------
let userScore = 0;
let computerScore = 0;

const userScore_span = document.getElementById('user-score');
const computerScore_span = document.getElementById('computer-score');
const result_p = document.querySelector('.result > p');
const rock_div = document.getElementById('r');
const paper_div = document.getElementById('p');
const scissors_div = document.getElementById('s');

// -------------------- Blockchain Setup --------------------
const contractAddress = "0x3d6e0Ab6F1773763Cf4bc0749119412157Bd6a87";
const contractABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum RPS.Move",
				"name": "playerMove",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "enum RPS.Move",
				"name": "computerMove",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "result",
				"type": "string"
			}
		],
		"name": "GamePlayed",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "enum RPS.Move",
				"name": "_playerMove",
				"type": "uint8"
			}
		],
		"name": "play",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "betAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let provider; 
let signer;
let contract;

const connectBtn = document.getElementById("connectBtn");

// -------------------- Connect Wallet --------------------
connectBtn.addEventListener("click", async () => {
    if (!window.ethereum) {
        alert("Install MetaMask!");
        return;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        connectBtn.innerText = "Wallet Connected";

        console.log("Connected:", await signer.getAddress());

    } catch (error) {
        console.error("Connection error:", error);
    }
});

// -------------------- Utility Functions --------------------
function convertToWord(move) {
    if (move === 'r' || move === 0) return "Rock";
    if (move === 'p' || move === 1) return "Paper";
    if (move === 's' || move === 2) return "Scissors";
}

function getLocalComputerChoice() {
    const choices = ['r', 'p', 's'];
    return choices[Math.floor(Math.random() * 3)];
}

function win(userChoice, computerChoice) {
    userScore++;
    userScore_span.innerHTML = userScore;
    result_p.innerHTML = `${convertToWord(userChoice)} beats ${convertToWord(computerChoice)}. You WIN!`;
}

function lose(userChoice, computerChoice) {
    computerScore++;
    computerScore_span.innerHTML = computerScore;
    result_p.innerHTML = `${convertToWord(userChoice)} loses to ${convertToWord(computerChoice)}. You LOST.`;
}

function draw(userChoice, computerChoice) {
    result_p.innerHTML = `${convertToWord(userChoice)} equals ${convertToWord(computerChoice)}. It's a DRAW.`;
}

// -------------------- Main Game Function --------------------
async function game(userChoice) {
    // Blockchain connected → use smart contract
    if (contract) {
        result_p.innerHTML = "Waiting for transaction confirmation...";

        let choiceNum = (userChoice === 'r') ? 0 : (userChoice === 'p') ? 1 : 2;

        try {
            const tx = await contract.play(choiceNum, {
                value: ethers.utils.parseEther("0.0001")
            });

            await tx.wait(); // Wait for block
            result_p.innerHTML = "Waiting for game result...";

        } catch (error) {
            console.error("Transaction error:", error);
            result_p.innerHTML = "Transaction rejected or failed.";
        }

        return;
    }

    // Fallback: local JS game (no blockchain)
    const computerChoice = getLocalComputerChoice();

    if (userChoice + computerChoice === "rs" || userChoice + computerChoice === "pr" || userChoice + computerChoice === "sp")
        win(userChoice, computerChoice);
    else if (userChoice + computerChoice === "rp" || userChoice + computerChoice === "ps" || userChoice + computerChoice === "sr")
        lose(userChoice, computerChoice);
    else
        draw(userChoice, computerChoice);
}

// -------------------- Listen for Smart Contract Event --------------------
if (window.ethereum) {
    window.ethereum.on("chainChanged", () => window.location.reload());
}

function setupEventListener() {
    if (!contract) return;

    contract.on("GamePlayed", async (player, playerMove, computerMove, result) => {

        const userAddr = await signer.getAddress();
        if (player.toLowerCase() !== userAddr.toLowerCase()) return;

        result_p.innerHTML =
            `${convertToWord(playerMove)} (you) vs ${convertToWord(computerMove)} (computer). ${result}`;

        if (result.includes("win")) userScore++;
        if (result.includes("lost")) computerScore++;

        userScore_span.innerHTML = userScore;
        computerScore_span.innerHTML = computerScore;
    });
}

setInterval(() => {
    if (contract) setupEventListener();
}, 1500);

// -------------------- Click Handlers --------------------
function main() {
    rock_div.addEventListener("click", () => game('r'));
    paper_div.addEventListener("click", () => game('p'));
    scissors_div.addEventListener("click", () => game('s'));
}

main();