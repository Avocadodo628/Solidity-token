import { expect } from "chai";
import { network } from "hardhat";


const { ethers } = await network.connect();
const { parseUnits, ZeroAddress } = ethers;




describe("MyToken", function() {
    // 部署合约 + 准备账号的 fixture
  async function deployMyTokenFixture() {
    // 1. 获取合约工厂
    const MyToken = await ethers.getContractFactory("MyToken");
    // 2. 拿到四个测试账号
    const [owner, addr1, addr2, spender] = await ethers.getSigners();
    // 3. 用 owner 部署合约
    const token = await MyToken.connect(owner).deploy("MyToken", "MTK");
    await token.waitForDeployment();
console.log("Token Address:"+await token.getAddress());
    // 4. 返回对象，后续测试可以解构拿到这些东西
    return { token, owner, addr1, addr2, spender };
 }


describe("deploy", function () {
  it("应该正确初始化基本信息", async function () {
    // 1. 从 fixture 拿对象
    const { token, owner } = await deployMyTokenFixture();
    // 2. 检查 name
    expect(await token.name()).to.equal("MyToken");
    // 3. 检查 symbol
    expect(await token.symbol()).to.equal("MTK");
    // 4. 检查 totalSupply
    expect(await token.totalSupply()).to.equal(0n);
    // 5. 检查 owner
    expect(await token.owner()).to.equal(owner.address);
  });
});


describe("mint", function () {
  it("owner 可以铸币，余额和总量应增加并触发 Transfer(0=>addr1)", async function () {
    const { token, owner, addr1 } = await deployMyTokenFixture();
    const amount = parseUnits("1000", 18);
    
    // owner 调用 mint 给 addr1，应该成功并触发 Transfer(0 => addr1)
    await expect(
      token.connect(owner).mint(addr1.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(ZeroAddress, addr1.address, amount);

    // totalSupply 应等于铸造数量
    expect(await token.totalSupply()).to.equal(amount);
    // addr1 余额应等于铸造数量
    expect(await token.balanceOf(addr1.address)).to.equal(amount);
   });
  
   
  it("非 owner 铸币应当失败（Ownable 限制）", async function () {
    const { token, addr1 } = await deployMyTokenFixture();
   
    // 使用非 owner（addr1）去 mint，应该触发 OwnableUnauthorizedAccount 错误
  await expect(
    token.connect(addr1).mint(addr1.address, 1n))
    .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
    .withArgs(addr1.address);
  });
});


describe("transfer", function () {
  it("余额足够时，持币人可以成功转账，事件与余额都应正确", async function () {
    const { token, owner, addr1, addr2 } = await deployMyTokenFixture();

    // 1.先给 addr1 铸造一些代币，确保它有足够余额
    const minted = parseUnits("1000", 18);
    await token.connect(owner).mint(addr1.address, minted);
    // 2.从 addr1 向 addr2 转出一部分
    const amount = parseUnits("200", 18);
    await expect(
      token.connect(addr1).transfer(addr2.address，
        amount))
    // 3.应该触发 Transfer(addr1 => addr2, amount) 事件
      .to.emit(token, "Transfer")
      .withArgs(addr1.address, addr2.address, amount);
    // 转账后，addr1 的余额应减少 amount
    expect(await token.balanceOf(addr1.address)).to.equal(minted - amount);
    // addr2 的余额应增加 amount
    expect(await token.balanceOf(addr2.address)).to.equal(amount);
  });

  it("余额不足时，转账应当失败并 revert", async function () {
    const { token, addr1, addr2 } = await deployMyTokenFixture();

    // 此时 addr1 初始余额为 0，直接转账 1n 应该失败
    await expect(
      token.connect(addr1).transfer(addr2.address, 1n)
    ).to.be.reverted; // 不指定具体错误信息
  });
});



});



