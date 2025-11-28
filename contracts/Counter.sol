/**
 * 练习要点：
 * 1) 可见性演示：public / external / internal / private
 * 2) uint 与 uint256 等价演示（别处用 uint，看能否正常编译）
 * 3) 事件（event）定义与触发
 * 4) 构造入参（设置初始值）
 * 5) increment / decrement 基本操作
 * 6) setX 带参数赋值
 * 7) 新增状态变量 y，并提供赋值函数 assignY（演示“给 y 赋值”）
 * 8) readY 作为 external 读取（y 是 private，不能自动生成 getter）
 * 9) internal 函数 _bumpZ 与 public 桥接 bumpZPublic
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Counter {
    // 状态 & 可见性演示
    uint256 public x; // 自动 getter
    uint private y;   // 用 uint(=uint256) 演示别名；private 无自动 getter
    uint256 internal z;

    // 事件
    event XChanged(uint256 newX);
    event YAssigned(uint256 newY);

    // 无参构造（兼容 Counter.t.sol）
    constructor() {
        x = 0;
        z = 0;
        emit XChanged(x);
    }

    // —— 基本操作 ——（以及 inc/dec 别名）
    function increment() public {
        x += 1;
        emit XChanged(x);
    }

    function decrement() public {
        require(x > 0, "UNDERFLOW");
        x -= 1;
        emit XChanged(x);
    }

    // 别名：兼容 Foundry 的调用
    function inc() public { increment(); }
    function dec() public { decrement(); }

    // 带参数赋值
    function setX(uint newX) public {
        x = newX;
        emit XChanged(newX);
    }

    // y 相关（给 y 赋值 + external 读取）
    function assignY(uint newY) public {
        y = newY;
        emit YAssigned(newY);
    }

    function readY() external view returns (uint) {
        return y;
    }

    // internal / external 演示
    function getZ() external view returns (uint256) {
        return z;
    }

    function bumpZPublic(uint256 v) public {
        _bumpZ(v);
    }

    function _bumpZ(uint256 v) internal {
        z += v;
    }

    // ===== 可见性实验想法 =====
    // function increment() external { x += 1; emit XChanged(x); } // public 改 external？
    // function _bumpZ(uint256 v) private { z += v; } // internal 改 private 会导致上面的桥接失败
    // uint256 private x; // x 改 private 后没有自动 getter x()
}
