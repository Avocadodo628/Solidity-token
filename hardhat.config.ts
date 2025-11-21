import { HardhatUserConfig } from "hardhat/config";
//import "@nomicfoundation/hardhat-toolbox"; // 只要这行
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: "0.8.28"
  // networks: {
  //   hardhat: {},
  //   sepolia: {
  //     url: process.env.SEPOLIA_RPC_URL || "",
  //     accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  //     chainId: 11155111,
  //   },
  // },
};

export default config;

