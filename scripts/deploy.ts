import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";     // 只启用 ethers 插件
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: { type: "edr-simulated" },      // 本地网络（保留即可）
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};

export default config;
