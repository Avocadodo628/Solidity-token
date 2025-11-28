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

    //尝试测试向ZeroAddress mint：
    it("向 ZeroAddress mint 应当失败（触发 ERC20InvalidReceiver）", async function () {
  const { token, owner } = await deployMyTokenFixture();
  const amount = parseUnits("1000", 18);

  await expect(
    token.connect(owner).mint(ZeroAddress, amount)
  )
    .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver")
    .withArgs(ZeroAddress); // 必须带参数，因为错误定义里有 receiver 地址
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
      token.connect(addr1).transfer(addr2.address,
        amount))
    // 3.应该触发 Transfer(addr1 => addr2, amount) 事件
      .to.emit(token, "Transfer")
      .withArgs(addr1.address, addr2.address, amount);
    // 转账后，addr1 的余额应减少 amount
    expect(await token.balanceOf(addr1.address)).to.equal(minted - amount);
    // addr2 的余额应增加 amount
    expect(await token.balanceOf(addr2.address)).to.equal(amount);
  });

   // 测试向ZeroAddress转账：
 it("向 ZeroAddress 转账应当失败（触发 ERC20InvalidReceiver）", async function () {
  const { token, owner, addr1 } = await deployMyTokenFixture();
  const minted = parseUnits("1000", 18);

  // 先给 addr1 一点余额
  await token.connect(owner).mint(addr1.address, minted);

  // 尝试把钱转给 ZeroAddress
  await expect(
    token.connect(addr1).transfer(ZeroAddress, 100n)
  )
    .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver")
    .withArgs(ZeroAddress);
});


    // 测试转账时转账金额为0：
 it("转账金额为 0 应当成功，并触发 0 金额 Transfer 事件", async function () {
  const { token, owner, addr1 } = await deployMyTokenFixture();

  // 0 金额转账不会改变余额
  await expect(
    token.connect(owner).transfer(addr1.address, 0)
  )
    .to.emit(token, "Transfer")
    .withArgs(owner.address, addr1.address, 0);

  // 确保余额没变化
  expect(await token.balanceOf(owner.address)).to.equal(0);
  expect(await token.balanceOf(addr1.address)).to.equal(0);
});

  
  it("余额不足时，转账应当失败并 revert ERC20InsufficientBalance", async function () {
  const { token, addr1, addr2 } = await deployMyTokenFixture();

  // addr1 初始余额为 0，尝试转 1 => 必定触发 ERC20InsufficientBalance
  await expect(
    token.connect(addr1).transfer(addr2.address, 1n)
  )
    .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
    .withArgs(
      addr1.address, // sender
      0n,            // 当前余额
      1n             // 需要但没有的金额
    );
});

});


//测试用例：测试approve的使用：授权和取消授权（会用到查询授权额度） 记得验证授权额度是否可以大于余额
describe("approve", function () {
  it("owner 可以授权 spender 使用代币（更新 allowance 并触发 Approval 事件）", async function () {
    const { token, owner, addr1 } = await deployMyTokenFixture();
    const amount = parseUnits("1000", 18);

    // owner 授权 addr1 可以代为使用 amount 额度
    await expect(
      token.connect(owner).approve(addr1.address, amount)
    )
      .to.emit(token, "Approval")
      .withArgs(owner.address, addr1.address, amount);

    // 查询授权额度是否正确
    expect(
      await token.allowance(owner.address, addr1.address)
    ).to.equal(amount);
  });

  it("再次 approve 会修改授权额度，设为 0 相当于取消授权", async function () {
    const { token, owner, addr1 } = await deployMyTokenFixture();
    const firstAmount = parseUnits("1000", 18);
    const secondAmount = parseUnits("500", 18);

    // 第一次授权
    await token.connect(owner).approve(addr1.address, firstAmount);
    expect(
      await token.allowance(owner.address, addr1.address)
    ).to.equal(firstAmount);

    // 第二次授权（修改额度）
    await expect(
      token.connect(owner).approve(addr1.address, secondAmount)
    )
      .to.emit(token, "Approval")
      .withArgs(owner.address, addr1.address, secondAmount);

    expect(
      await token.allowance(owner.address, addr1.address)
    ).to.equal(secondAmount);

    // 将授权额度设为 0，相当于取消授权
    await expect(
      token.connect(owner).approve(addr1.address, 0)
    )
      .to.emit(token, "Approval")
      .withArgs(owner.address, addr1.address, 0);

    expect(
      await token.allowance(owner.address, addr1.address)
    ).to.equal(0n);
  });

  it("授权额度可以大于当前余额（允许超额授权）", async function () {
    const { token, owner, addr1 } = await deployMyTokenFixture();

    // 此时 owner 初始余额为 0
    expect(await token.balanceOf(owner.address)).to.equal(0n);

    const bigAllowance = parseUnits("1000", 18);

    // 即使余额为 0，也允许授权 1000 额度
    await expect(
      token.connect(owner).approve(addr1.address, bigAllowance)
    )
      .to.emit(token, "Approval")
      .withArgs(owner.address, addr1.address, bigAllowance);

    expect(
      await token.allowance(owner.address, addr1.address)
    ).to.equal(bigAllowance);
  });

  it("向 ZeroAddress 授权应当失败（触发 ERC20InvalidSpender）", async function () {
    const { token, owner } = await deployMyTokenFixture();

    await expect(
      token.connect(owner).approve(ZeroAddress, 1n)
    )
      .to.be.revertedWithCustomError(token, "ERC20InvalidSpender")
      .withArgs(ZeroAddress);
  });
});




  //测试transferfrom的使用（会用到approve的授权）：成功和失败（失败有好几种：没有授权：授权的额度不足；额度足余额不足）记得验证转账后剩余的额度是否是预期的
  describe("transferFrom", function () {
  it("spender 可以在授权额度内使用 transferFrom 转账（余额和授权额度都会正确更新）", async function () {
    const { token, owner, addr1, addr2 } = await deployMyTokenFixture();

    const minted = parseUnits("1000", 18);
    const allowanceAmount = parseUnits("500", 18);
    const transferAmount = parseUnits("200", 18);

    // 先给 owner 铸币
    await token.connect(owner).mint(owner.address, minted);

    // owner 授权 addr1 可以代替自己转账
    await token.connect(owner).approve(addr1.address, allowanceAmount);

    // 使用 transferFrom 转出一部分
    await expect(
      token
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, transferAmount)
    )
      .to.emit(token, "Transfer")
      .withArgs(owner.address, addr2.address, transferAmount);

    // owner 余额减少
    expect(await token.balanceOf(owner.address)).to.equal(
      minted - transferAmount
    );
    // addr2 余额增加
    expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
    // 授权额度同步减少
    expect(
      await token.allowance(owner.address, addr1.address)
    ).to.equal(allowanceAmount - transferAmount);
  });

  it("未授权的情况下使用 transferFrom 应当失败（ERC20InsufficientAllowance）", async function () {
    const { token, owner, addr1, addr2 } = await deployMyTokenFixture();

    const amount = parseUnits("100", 18);

    // 默认情况下 owner 对 addr1 的授权额度为 0
    expect(
      await token.allowance(owner.address, addr1.address)
    ).to.equal(0n);

    await expect(
      token
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, amount)
    )
      .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
      .withArgs(
        addr1.address, // spender = msg.sender
        0n,            // 当前 allowance
        amount         // 需要的额度
      );
  });

  it("授权额度不足时使用 transferFrom 应当失败（ERC20InsufficientAllowance）", async function () {
    const { token, owner, addr1, addr2 } = await deployMyTokenFixture();

    const minted = parseUnits("1000", 18);
    const smallAllowance = parseUnits("100", 18);
    const amount = parseUnits("200", 18); // 大于授权额度

    // 先给 owner 足够余额
    await token.connect(owner).mint(owner.address, minted);

    // 授权较小额度
    await token.connect(owner).approve(addr1.address, smallAllowance);

    await expect(
      token
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, amount)
    )
      .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
      .withArgs(
        addr1.address,   // spender = msg.sender
        smallAllowance,  // 当前 allowance
        amount           // 需要的额度
      );
  });

  it("授权额度足够但余额不足时使用 transferFrom 应当失败（ERC20InsufficientBalance）", async function () {
    const { token, owner, addr1, addr2 } = await deployMyTokenFixture();

    const minted = parseUnits("50", 18);     // 实际余额只有 50
    const bigAllowance = parseUnits("100", 18); // 授权额度比余额大
    const amount = parseUnits("80", 18);    // 想转 80 > 余额 50

    // 给 owner 铸少量币
    await token.connect(owner).mint(owner.address, minted);

    // 授权一个比余额大的额度
    await token.connect(owner).approve(addr1.address, bigAllowance);

    await expect(
      token
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, amount)
    )
      .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
      .withArgs(
        owner.address, // sender / from
        minted,        // 当前余额
        amount         // 需要的金额
      );
  });
});



  // 看一下erc20里面是怎么存储这些数据的 比如map
  //

});



