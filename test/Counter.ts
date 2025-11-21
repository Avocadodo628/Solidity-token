import { expect } from "chai";
import { network } from "hardhat";

/**
 * 精简测试点：
 * 1) 部署带参数（initialX, initialZ）
 * 2) 读取 x（public 自带 getter）
 * 3) increment / decrement 及事件
 * 4) setX(参数) 与事件
 * 5) 给 y 赋值（assignY），并通过 readY(external) 读取
 * 6) getZ(external) 与 bumpZPublic(public -> internal)
 */

describe("Counter (lean practice)", function () {
  async function deployFixture() {
    const Counter = await ethers.getContractFactory("Counter");
    const counter = await Counter.deploy(5, 2); // initialX=5, initialZ=2
    await counter.waitForDeployment();
    return { counter };
  }

  it("部署后：x 应为 initialX，z 可通过 getZ 读取", async () => {
    const { counter } = await loadFixture(deployFixture);
    expect(await counter.x()).to.equal(5n);
    expect(await counter.getZ()).to.equal(2n);
  });

  it("increment / decrement：应改值并触发事件", async () => {
    const { counter } = await loadFixture(deployFixture);

    await expect(counter.increment())
      .to.emit(counter, "XChanged")
      .withArgs(6n);
    expect(await counter.x()).to.equal(6n);

    await expect(counter.decrement())
      .to.emit(counter, "XChanged")
      .withArgs(5n);
    expect(await counter.x()).to.equal(5n);
  });

  it("setX：参数赋值并触发事件", async () => {
    const { counter } = await loadFixture(deployFixture);
    await expect(counter.setX(42))
      .to.emit(counter, "XChanged")
      .withArgs(42n);
    expect(await counter.x()).to.equal(42n);
  });

  it("给 y 赋值：assignY & readY(external)", async () => {
    const { counter } = await loadFixture(deployFixture);
    await expect(counter.assignY(999))
      .to.emit(counter, "YAssigned")
      .withArgs(999n);
    expect(await counter.readY()).to.equal(999n);
  });

  it("z：bumpZPublic(public->internal) 后通过 getZ(external) 校验", async () => {
    const { counter } = await loadFixture(deployFixture);
    await counter.bumpZPublic(10);
    expect(await counter.getZ()).to.equal(12n);
  });

  // ======== 可见性实验想法 ========
  // 1) 把 increment 的可见性改成 external：
  //    - 仍可从测试里调用（外部调用），但合约内部若再调用就不行了。
  // 2) 把 _bumpZ 改成 private：
  //    - bumpZPublic 会编译失败（因为 private 只能本函数内用），
  //      可以把桥接逻辑改成直接写 z += v 再对比。
});
