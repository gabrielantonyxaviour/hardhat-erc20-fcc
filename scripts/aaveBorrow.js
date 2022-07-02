const { ethers, getNamedAccounts, network } = require("hardhat")
const { getWeth, AMOUNT } = require("./getWeth")

const { networkConfig } = require("../helper-hardhat-config")

async function main() {
    // get Wrapped Ethereum
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    console.log(`lendingPool: ${lendingPool.address}`)

    const wethTokenAddress = networkConfig[network.config.chainId].wethToken
    // Approve Wrapped Ether
    await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    // Deposit Wrapped Ether
    console.log(`Depositing ${AMOUNT} WETH`)
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log(`Deposited ${AMOUNT} WETH`)

    // Borrow DAI
    const { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)

    // Get DAI price
    const daiPrice = await getDaiPrice()
    82500000000000000
    // Borrow DAI
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / parseInt(daiPrice))
    console.log(`You can borrow ${amountDaiToBorrow} DAI`)
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`You can borrow ${amountDaiToBorrowWei} DAI in Wei...`)

    console.log(`Borrowing....`)
    await borrowDAI(
        networkConfig[network.config.chainId].daiToken,
        lendingPool,
        amountDaiToBorrowWei,
        deployer
    )

    await getBorrowUserData(lendingPool, deployer)

    // Repay DAI
    await repay(
        amountDaiToBorrowWei,
        networkConfig[network.config.chainId].daiToken,
        lendingPool,
        deployer
    )
    await getBorrowUserData(lendingPool, deployer)
}

async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        networkConfig[network.config.chainId].lendingPoolAddressesProvider,
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPool
}

async function approveERC20(erc20Address, spenderAddress, amountToSpend, account) {
    const contract = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await contract.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log(`Approved ${amountToSpend} to ${spenderAddress}`)
}

async function getBorrowUserData(lendingPool, account) {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH
    } = await lendingPool.getUserAccountData(account)
    console.log(`You have total Collateral: ${totalCollateralETH} ETH`)
    console.log(`You have total Debt: ${totalDebtETH} ETH`)
    console.log(`You have available Borrows: ${availableBorrowsETH} ETH`)
    return { availableBorrowsETH, totalDebtETH }
}

async function getDaiPrice() {
    const daiETHPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        networkConfig[network.config.chainId].daiEthPriceFeed
    )
    const price = (await daiETHPriceFeed.latestRoundData())[1]
    console.log(`DAI/ETH price: ${price}`)
    return price
}

async function borrowDAI(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
    const borrowtx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 1, 0, account)
    await borrowtx.wait(1)
    console.log(`Borrowed ${amountDaiToBorrowWei} DAI!!`)
}

async function repay(amount, daiAddress, lendingPool, account) {
    await approveERC20(daiAddress, lendingPool.address, amount, account)
    const repaytx = await lendingPool.repay(daiAddress, amount, account)
    await repaytx.wait(1)
    console.log(`Repaid ${amount} DAI`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
