import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();


const { parseUnits, ZeroAddress } = ethers;

describe("MyToken", function () {
  async function deployMyTokenFixture() {
    const [owner, addr1, addr2, spender] = await ethers.getSigners();

    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.connect(owner).deploy("MyToken", "MTK");
    await token.waitForDeployment();
console.log("Token地址:"+await token.getAddress());
    return { token, owner, addr1, addr2, spender };
  }

  describe("deploy", function () { 
    it("应当成功部署并初始化元数据与初始供应", async function () {
      const { token, owner } = await deployMyTokenFixture();

      expect(await token.name()).to.equal("MyToken");
      expect(await token.symbol()).to.equal("MTK");
      expect(await token.totalSupply()).to.equal(0n);

      // Ownable v5: owner() 暴露自 Ownable
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("mint", function () {
    it("owner 可以铸造；余额与总量应增加，并触发 Transfer(0=>addr1)", async function () {
      const { token, owner, addr1 } = await deployMyTokenFixture();

      const amount = parseUnits("1000", 18);
      await expect(token.connect(owner).mint(addr1.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(ZeroAddress, addr1.address, amount);

      expect(await token.totalSupply()).to.equal(amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("非 owner 铸造应 revert（Ownable 限制）", async function () {
      const { token, addr1 } = await deployMyTokenFixture();
      await expect(
        token.connect(addr1).mint(addr1.address, 1n)
      )
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("transfer", function () {
    it("持币人可转账；余额与事件正确", async function () {
      const { token, owner, addr1, addr2 } = await deployMyTokenFixture();

      const minted = parseUnits("1000", 18);
      await token.connect(owner).mint(addr1.address, minted);

      const amount = parseUnits("200", 18);
      await expect(token.connect(addr1).transfer(addr2.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(addr1.address, addr2.address, amount);

      expect(await token.balanceOf(addr1.address)).to.equal(minted - amount);
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
    });

    it("余额不足转账应 revert", async function () {
      const { token, addr1, addr2 } = await deployMyTokenFixture();
      await expect(
        token.connect(addr1).transfer(addr2.address, 1n)
      ).to.be.reverted; // 不强绑具体错误，避免不同实现差异
    });
  });
});
