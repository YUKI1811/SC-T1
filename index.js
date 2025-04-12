// Versi bolak-balik Sepolia ⇄ T1 + delay antar loop 55 detik
import "dotenv/config";
import { ethers } from "ethers";
import readline from "readline";

// ===== Konfigurasi .env =====
const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA;
const RPC_URL_T1 = process.env.RPC_URL_T1;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== Kontrak & ChainID =====
const Router_Sepolia = "0xAFdF5cb097D6FB2EB8B1FFbAB180e667458e18F4";
const Router_T1 = "0x627B3692969b7330b8Faed2A8836A41EB4aC1918";

const destChainIdT1 = 299792;
const destChainIdSepolia = 11155111;

const BridgeABI = [
  "function sendMessage(address _to, uint256 _value, bytes _message, uint256 _gasLimit, uint64 _destChainId, address _callbackAddress) external payable"
];

// ===== Fungsi Utility =====
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function getRandomAmount(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(6));
}

async function getBalance(provider, address) {
  const balance = await provider.getBalance(address);
  return Number(ethers.formatEther(balance));
}

// ===== Sepolia ke T1 =====
async function bridgeSepoliaToT1() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL_SEPOLIA);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(Router_Sepolia, BridgeABI, wallet);

    const ethAmount = getRandomAmount(0.0002, 0.0006);
    const amount = ethers.parseEther(ethAmount.toString());
    const fee = ethers.parseEther("0.000000000000168");
    const total = amount + fee;
    const balance = await getBalance(provider, wallet.address);

    if (balance < Number(ethers.formatEther(total))) {
      console.log("⚠️ Sepolia saldo tidak cukup. Skip transaksi.");
      return;
    }

    console.log(`\n🔁 Kirim ${ethAmount} ETH dari Sepolia ke T1`);
    const tx = await contract.sendMessage(
      wallet.address,
      amount,
      "0x",
      168000,
      destChainIdT1,
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

// ===== T1 ke Sepolia =====
async function bridgeT1ToSepolia() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL_T1);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(Router_T1, BridgeABI, wallet);

    const ethAmount = getRandomAmount(0.0001, 0.001);
    const amount = ethers.parseEther(ethAmount.toString());
    const balance = await provider.getBalance(wallet.address);
    const total = amount;

    if (balance < Number(ethers.formatEther(total))) {
      console.log("⚠️ T1 saldo tidak cukup. Skip transaksi.");
      return;
    }

    console.log(`\n🔁 Kirim ${ethAmount} ETH dari T1 ke Sepolia`);
    const tx = await contract.sendMessage(
      wallet.address,
      amount,
      "0x",
      0, // ⚠️ Untuk T1 ke Sepolia gasLimit HARUS 0
      destChainIdSepolia,
      wallet.address,
      {
        value: total,
        gasLimit: 500000
      }
    );

    console.log(`TX Hash: ${tx.hash}`);
    await tx.wait();
    console.log("✅ T1 → Sepolia selesai!");
  } catch (err) {
    console.error("❌ Gagal Bridge T1 → Sepolia:", err.shortMessage || err.message);
  }
}

// ===== Input CLI =====
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

// ===== MAIN =====
async function main() {
  console.log("\n=== Bridge Sepolia ⇄ T1 ===");
  const jumlah = await prompt("Mau ngulang berapa kali cuy?: ");
  const repeat = parseInt(jumlah);

  for (let i = 1; i <= repeat; i++) {
    console.log(`\n🌐 Loop #${i}`);

    await bridgeSepoliaToT1();
    await bridgeT1ToSepolia();

    if (i !== repeat) {
      console.log("⏳ Delay 55 detik sebelum loop selanjutnya...\n");
      await delay(55000);
    }
  }

  console.log("\n🔥 DONE YA MEK! ~CREATED BY AGIL GANTENG ~");
}

main();
