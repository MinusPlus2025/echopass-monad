import { expect } from 'chai'
import { artifacts, network } from 'hardhat'

import { echoPassAbi } from '../../src/contract/abi.js'
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

  it('rejects a voucher from an unauthorized signer', async function () {
    const fixture = await deployFixture()
    const { voucher } = await voucherFor(fixture)
    const signature = await signVoucher(fixture.anotherAttendee, voucher)
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

  it('rejects a voucher bound to another chain', async function () {
    const fixture = await deployFixture()
    const currentNetwork = await ethers.provider.getNetwork()
    const { signature, voucher } = await voucherFor(fixture, {
      chainId: currentNetwork.chainId + 1n,
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

  it('rejects a voucher replayed on another contract', async function () {
    const fixture = await deployFixture()
    const otherContract = await ethers.deployContract('EchoPass', [
      fixture.voucherSigner.address,
    ])
    await otherContract.waitForDeployment()
    const { signature, voucher } = await voucherFor(fixture, {
      contractAddress: await otherContract.getAddress(),
    })
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      0,
    )
    await otherContract.createEvent(
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

  it('rejects a voucher replayed for another existing event', async function () {
    const fixture = await deployFixture()
    const { signature, voucher } = await voucherFor(fixture)
    const otherEventId = ethers.id('monad-blitz-afterparty')
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      0,
    )
    await fixture.contract.createEvent(
      otherEventId,
      fixture.now + 3_600n,
      0,
    )

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .claim(
          otherEventId,
          voucher.validUntil,
          voucher.signalHash,
          signature,
        ),
    ).to.be.revertedWith('invalid voucher')
  })

  it('rejects a voucher submitted with another signal hash', async function () {
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
          ethers.id('heard:000000'),
          signature,
        ),
    ).to.be.revertedWith('invalid voucher')
  })

  it('rejects a voucher submitted with another unexpired validity', async function () {
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
          voucher.validUntil + 1n,
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
      ethers,
      [fixture.contract, fixture.attendee],
      [-reward, reward],
    )
  })

  it('supports multiple claims from one event budget', async function () {
    const fixture = await deployFixture()
    const reward = ethers.parseEther('0.01')
    const first = await voucherFor(fixture)
    const second = await voucherFor(fixture, {
      claimant: fixture.anotherAttendee.address,
    })
    await fixture.contract.createEvent(
      first.voucher.eventId,
      fixture.now + 3_600n,
      reward,
      { value: reward * 2n },
    )

    await fixture.contract
      .connect(fixture.attendee)
      .claim(
        first.voucher.eventId,
        first.voucher.validUntil,
        first.voucher.signalHash,
        first.signature,
      )
    await fixture.contract
      .connect(fixture.anotherAttendee)
      .claim(
        second.voucher.eventId,
        second.voucher.validUntil,
        second.voucher.signalHash,
        second.signature,
      )

    expect(await fixture.contract.eventBalance(first.voucher.eventId)).to.equal(
      0n,
    )
  })

  it('prevents one event from consuming another event budget', async function () {
    const fixture = await deployFixture()
    const reward = ethers.parseEther('0.01')
    const eventA = await voucherFor(fixture)
    const eventBId = ethers.id('separately-funded-event')
    const eventASecond = await voucherFor(fixture, {
      claimant: fixture.anotherAttendee.address,
    })
    const eventB = await voucherFor(fixture, {
      claimant: fixture.anotherAttendee.address,
      eventId: eventBId,
    })
    await fixture.contract.createEvent(
      eventA.voucher.eventId,
      fixture.now + 3_600n,
      reward,
      { value: reward },
    )
    await fixture.contract.createEvent(
      eventBId,
      fixture.now + 3_600n,
      reward,
      { value: reward },
    )
    await fixture.contract
      .connect(fixture.attendee)
      .claim(
        eventA.voucher.eventId,
        eventA.voucher.validUntil,
        eventA.voucher.signalHash,
        eventA.signature,
      )

    await expect(
      fixture.contract
        .connect(fixture.anotherAttendee)
        .claim(
          eventASecond.voucher.eventId,
          eventASecond.voucher.validUntil,
          eventASecond.voucher.signalHash,
          eventASecond.signature,
        ),
    ).to.be.revertedWith('event reward exhausted')

    await expect(
      fixture.contract
        .connect(fixture.anotherAttendee)
        .claim(
          eventB.voucher.eventId,
          eventB.voucher.validUntil,
          eventB.voucher.signalHash,
          eventB.signature,
        ),
    ).to.emit(fixture.contract, 'PresenceClaimed')
  })

  it('rolls back claim state and budget when reward transfer fails', async function () {
    const fixture = await deployFixture()
    const reward = ethers.parseEther('0.01')
    const rejectingClaimant = await ethers.deployContract('RejectingClaimant')
    await rejectingClaimant.waitForDeployment()
    const { signature, voucher } = await voucherFor(fixture, {
      claimant: await rejectingClaimant.getAddress(),
    })
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      reward,
      { value: reward },
    )

    await expect(
      rejectingClaimant.claim(
        await fixture.contract.getAddress(),
        voucher.eventId,
        voucher.validUntil,
        voucher.signalHash,
        signature,
      ),
    ).to.be.revertedWith('reward transfer failed')

    expect(
      await fixture.contract.hasClaimed(
        voucher.eventId,
        await rejectingClaimant.getAddress(),
      ),
    ).to.equal(false)
    expect(await fixture.contract.eventBalance(voucher.eventId)).to.equal(
      reward,
    )
  })

  it('lets the organizer withdraw an event remainder after it ends', async function () {
    const fixture = await deployFixture()
    const reward = ethers.parseEther('0.01')
    const endsAt = fixture.now + 10n
    const { voucher } = await voucherFor(fixture)
    await fixture.contract.createEvent(voucher.eventId, endsAt, reward, {
      value: reward * 2n,
    })
    await ethers.provider.send('evm_setNextBlockTimestamp', [
      Number(endsAt + 1n),
    ])
    await ethers.provider.send('evm_mine', [])

    await expect(
      fixture.contract.withdrawEventFunds(
        voucher.eventId,
        fixture.organizer.address,
      ),
    ).to.changeEtherBalances(
      ethers,
      [fixture.contract, fixture.organizer],
      [-(reward * 2n), reward * 2n],
    )
    expect(await fixture.contract.eventBalance(voucher.eventId)).to.equal(0n)
  })

  it('rejects event-fund withdrawal by a non-organizer', async function () {
    const fixture = await deployFixture()
    const reward = ethers.parseEther('0.01')
    const endsAt = fixture.now + 10n
    const { voucher } = await voucherFor(fixture)
    await fixture.contract.createEvent(voucher.eventId, endsAt, reward, {
      value: reward,
    })
    await ethers.provider.send('evm_setNextBlockTimestamp', [
      Number(endsAt + 1n),
    ])
    await ethers.provider.send('evm_mine', [])

    await expect(
      fixture.contract
        .connect(fixture.attendee)
        .withdrawEventFunds(voucher.eventId, fixture.attendee.address),
    ).to.be.revertedWith('only organizer')
  })

  it('rejects event-fund withdrawal while the event is active', async function () {
    const fixture = await deployFixture()
    const reward = ethers.parseEther('0.01')
    const { voucher } = await voucherFor(fixture)
    await fixture.contract.createEvent(
      voucher.eventId,
      fixture.now + 3_600n,
      reward,
      { value: reward },
    )

    await expect(
      fixture.contract.withdrawEventFunds(
        voucher.eventId,
        fixture.organizer.address,
      ),
    ).to.be.revertedWith('event active')
  })

  it('keeps the frontend ABI in parity with the compiled contract', async function () {
    type Parameter = { type: string; indexed?: boolean }
    type AbiItem = {
      type: string
      name?: string
      inputs?: readonly Parameter[]
      outputs?: readonly Parameter[]
      stateMutability?: string
      anonymous?: boolean
    }
    const normalize = (items: readonly AbiItem[]) =>
      items
        .map((item) => ({
          anonymous: item.anonymous ?? false,
          inputs: (item.inputs ?? []).map(({ indexed, type }) => ({
            indexed: indexed ?? false,
            type,
          })),
          name: item.name ?? '',
          outputs: (item.outputs ?? []).map(({ type }) => ({ type })),
          stateMutability: item.stateMutability ?? '',
          type: item.type,
        }))
        .sort((left, right) =>
          JSON.stringify(left).localeCompare(JSON.stringify(right)),
        )
    const artifact = await artifacts.readArtifact('EchoPass')

    expect(normalize(echoPassAbi)).to.deep.equal(
      normalize(artifact.abi as AbiItem[]),
    )
  })
})
