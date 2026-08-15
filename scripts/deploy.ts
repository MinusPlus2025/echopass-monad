import { isAddress } from 'ethers'
import { network } from 'hardhat'

const { ethers } = await network.connect()
const [deployer] = await ethers.getSigners()
const voucherSigner = process.env.VOUCHER_SIGNER ?? deployer.address

if (!isAddress(voucherSigner)) {
  throw new Error('VOUCHER_SIGNER must be a valid address')
}

const echoPass = await ethers.deployContract('EchoPass', [voucherSigner])
await echoPass.waitForDeployment()

console.log('EchoPass deployed:', await echoPass.getAddress())
console.log('Organizer:', deployer.address)
console.log('Voucher signer:', voucherSigner)
