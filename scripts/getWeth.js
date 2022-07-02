const { getNamedAccounts, ethers } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

const AMOUNT = ethers.utils.parseEther("0.01")
async function getWeth() {
    const { deployer } = await getNamedAccounts()

    // we need abi and contract address to call functions of the contract
    // abi equivalent to interface of the contract
    // we get mainnet contract address from etherscan
    const iWeth = await ethers.getContractAt(
        "IWeth",
        networkConfig[network.config.chainId].wethToken, // forked mainnet
        deployer
    )

    const tx = await iWeth.deposit({ value: AMOUNT })
    await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(wethBalance)
}

module.exports = { getWeth, AMOUNT }
