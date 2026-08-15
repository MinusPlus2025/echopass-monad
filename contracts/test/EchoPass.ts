import { expect } from 'chai'
import { network } from 'hardhat'

import { signVoucher, type Voucher } from '../../src/domain/voucher.js'

const { ethers } = await network.connect()

describe('EchoPass', function () {
  async function deployFixture() {
    const [organizer, voucherSigner, attendee, anotherAttendee] =
      await ethers.getSigners()
    const contract = await ethers.deployContract('EchoPass', [
      voucherSigner.address,
    ])
    await contract.waitForDeployment()

    const latestBlock = await ethers.provider.getBlock('latest')
    if (!latestBlock) {
      throw new Error('Latest block unavailable')
    }

    return {
      anotherAttendee,
      attendee,
      contract,
      now: BigInt(latestBlock.timestamp),
      organizer,
      voucherSigner,
    }
  }

  async function voucherFor(
    fixture: Awaited<ReturnType<typeof deployFixture>>,
    overrides: Partial<Voucher> = {},
  ) {
    const networkDetails = await ethers.provider.getNetwork()
    const voucher: Voucher = {
      chainId: networkDetails.chainId,
      contractAddress: await fixture.contract.getAddress(),
      eventId: ethers.id('monad-blitz-demo'),
      claimant: fixture.attendee.address,
      signalHash: ethers.id('heard:482913'),
      validUntil: fixture.now + 300n,
      ...overrides,
    }

    return {
      signature: await signVoucher(fixture.voucherSigner, voucher),
      voucher,
    }
  }

  it('records a valid claim and emits PresenceClaimed', async function () {
    const fixture = await deployFixture()
    const { signature, voucher } = await voucherFor(fixture)
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      0,
    )

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .claim(
          voucher.eventId,
          voucher.validUntil,
          voucher.signalHash,
          signature,
        ),
    )
      .to.emit(fixture.contract, 'PresenceClaimed')
      .withArgs(voucher.eventId, fixture.attendee.address, 0)

    expect(
      await fixture.contract.hasClaimed(
        voucher.eventId,
        fixture.attendee.address,
      ),
    ).to.equal(true)
  })

  it('rejects a duplicate claim', async function () {
    const fixture = await deployFixture()
    const { signature, voucher } = await voucherFor(fixture)
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      0,
    )

    await fixture.contract
      .connect(fixture.attendee)
      .claim(
        voucher.eventId,
        voucher.validUntil,
        voucher.signalHash,
        signature,
      )

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .claim(
          voucher.eventId,
          voucher.validUntil,
          voucher.signalHash,
          signature,
        ),
    ).to.be.revertedWith('already claimed')
  })

  it('rejects an expired voucher', async function () {
    const fixture = await deployFixture()
    const { signature, voucher } = await voucherFor(fixture, {
      validUntil: fixture.now - 1n,
    })
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      0,
    )

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .claim(
          voucher.eventId,
          voucher.validUntil,
          voucher.signalHash,
          signature,
        ),
    ).to.be.revertedWith('voucher expired')
  })

  it('rejects a voucher bound to another wallet', async function () {
    const fixture = await deployFixture()
    const { signature, voucher } = await voucherFor(fixture, {
      claimant: fixture.anotherAttendee.address,
    })
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      0,
    )

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .claim(
          voucher.eventId,
          voucher.validUntil,
          voucher.signalHash,
          signature,
        ),
    ).to.be.revertedWith('invalid voucher')
  })

  it('rejects a claim after the event ends', async function () {
    const fixture = await deployFixture()
    const endsAt = fixture.now + 10n
    const { signature, voucher } = await voucherFor(fixture)
    await fixture.contract.createEvent(voucher.eventId, endsAt, 0)
    await ethers.provider.send('evm_setNextBlockTimestamp', [
      Number(endsAt + 1n),
    ])
    await ethers.provider.send('evm_mine', [])

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .claim(
          voucher.eventId,
          voucher.validUntil,
          voucher.signalHash,
          signature,
        ),
    ).to.be.revertedWith('event ended')
  })

  it('rejects a claim for an event that does not exist', async function () {
    const fixture = await deployFixture()
    const { signature, voucher } = await voucherFor(fixture)

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .claim(
          voucher.eventId,
          voucher.validUntil,
          voucher.signalHash,
          signature,
        ),
    ).to.be.revertedWith('event not found')
  })

  it('transfers the configured MON reward on claim', async function () {
    const fixture = await deployFixture()
    const reward = ethers.parseEther('0.01')
    const { signature, voucher } = await voucherFor(fixture)
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      reward,
      { value: reward },
    )

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .claim(
          voucher.eventId,
          voucher.validUntil,
          voucher.signalHash,
          signature,
        ),
    ).to.changeEtherBalances(
      [fixture.contract, fixture.attendee],
      [-reward, reward],
    )
  })
})
