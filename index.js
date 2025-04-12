import "dotenv/config";
import { ethers } from "ethers";
import readline from "readline";

const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA;
const RPC_URL_T1 = process.env.RPC_URL_T1;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ROUTER_SEPOLIA = "0xAFdF5cb097D6FB2EB8B1FFbAB180e667458e18F4";
const ROUTER_T1 = "0x627B3692969b7330b8Faed2A8836A41EB4aC1918";
const CHAINID_T1 = 299792;
const CHAINID_SEPOLIA = 11155111;

const ABI = [
  "function sendMessage(address _to, uint256 _value, bytes _message, uint256 _gasLimit, uint64 _destChainId, address _callbackAddress) external payable"
];

const delay = (ms) => new Promise(res => setTimeout(res, ms));
const DELAY_LOOP_MS = 55000;

async function showBalances() {
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const providerSepolia = new ethers.JsonRpcProvider(RPC_URL_SEPOLIA);
  const providerT1 = new ethers.JsonRpcProvider(RPC_URL_T1);

  const balanceSepolia = await providerSepolia.getBalance(wallet.address);
  const balanceT1 = await providerT1.getBalance(wallet.address);

  console.log(`\n💰 Saldo Sepolia: ${ethers.formatEther(balanceSepolia)} ETH`);
  console.log(`💰 Saldo T1     : ${ethers.formatEther(balanceT1)} ETH`);
}

function getRandomAmount(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(6));
}

async function bridgeSepoliaToT1() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL_SEPOLIA);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(ROUTER_SEPOLIA, ABI, wallet);

    const ethAmount = getRandomAmount(0.0002, 0.0006);
    const amount = ethers.parseEther(ethAmount.toString());
    const fee = ethers.parseEther("0.000000000000168");
    const total = amount + fee;

    const balance = await provider.getBalance(wallet.address);
    if (balance < total) {
      console.log("⚠️ Sepolia saldo tidak cukup.");
      return;
    }

    console.log(`\n🔁 Bridge ${ethAmount} ETH Sepolia → T1`);
    const tx = await contract.sendMessage(
      wallet.address,
      amount,
      "0x",
      168000,
      CHAINID_T1,
      wallet.address,
      { value: total, gasLimit: 500000 }
    );
    console.log(`TX Hash: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Sepolia → T1 selesai!");
  } catch (err) {
    console.error("❌ Gagal Bridge Sepolia → T1:", err.shortMessage || err.message);
  }
}

async function bridgeT1ToSepolia() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL_T1);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(ROUTER_T1, ABI, wallet);

    const ethAmount = getRandomAmount(0.0002, 0.0006);
    const amount = ethers.parseEther(ethAmount.toString());

    const balance = await provider.getBalance(wallet.address);
    if (balance < amount) {
      console.log("⚠️ T1 saldo tidak cukup.");
      return;
    }

    console.log(`\n🔁 Bridge ${ethAmount} ETH T1 → Sepolia`);
    const tx = await contract.sendMessage(
      wallet.address,
      amount,
      "0x",
      0,
      CHAINID_SEPOLIA,
      wallet.address,
      { value: amount, gasLimit: 500000 }
    );
    console.log(`TX Hash: ${tx.hash}`);
    await tx.wait();
    console.log("✅ T1 → Sepolia selesai!");
  } catch (err) {
    console.error("❌ Gagal Bridge T1 → Sepolia:", err.shortMessage || err.message);
  }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function main() {
  console.log("\n=== 🌉 Bridge Sepolia ⇄ T1 ~ AGIL GANTENG ===");

  // ⏱️ Tampilkan saldo sebelum mulai
  await showBalances();

  const repeat = parseInt(await prompt("\nMau ngulang berapa kali bro?: "));

  for (let i = 1; i <= repeat; i++) {
    console.log(`\n=== 🔁 Loop #${i} ===`);

    await bridgeSepoliaToT1();
    await bridgeT1ToSepolia();

    // ✅ Tampilkan saldo lagi setelah loop
    await showBalances();

    if (i !== repeat) {
      console.log(`\n🕐 Delay 55 detik sebelum loop ke-${i + 1}...\n`);
      await delay(DELAY_LOOP_MS);
    }
  }

  console.log("\n🔥 DONE YA MEK! ~ CREATED BY AGIL GANTENG ~");
}

main();
