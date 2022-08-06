const hre = require("hardhat");

const main = async () => {
    // deploy the contract locally
    const rsvpContractFactory = await hre.ethers.getContractFactory("Web3RSVP");
    const rsvpContract = await rsvpContractFactory.deploy();
    await rsvpContract.deployed();
    console.log("Contract deployed to:", rsvpContract.address);

    // get deployer address and a couple others for testing
    const [deployer, address1, address2] = await hre.ethers.getSigners();

    // define mock event data
    let deposit = hre.ethers.utils.parseEther("1");
    let maxCapacity = 3;
    let timestamp = 1718926200;
    let eventDataCID = "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";

    // create new event with mock data
    let txn = await rsvpContract.createNewEvent(
        timestamp,
        deposit,
        maxCapacity,
        eventDataCID
    );
    let wait = await txn.wait();
    console.log("NEW EVENT CREATED:", wait.events[0].event, wait.events[0].args);
    let eventID = wait.events[0].args.eventID;
    console.log("EVENT ID:", eventID);

    // rsvp using each account pulled from 'getSigners', start with deployer
    txn = await rsvpContract.createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP", wait.events[0].event, wait.events[0].args);
    // connect to second address to rsvp from
    txn = await rsvpContract
        .connect(address1)
        .createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP", wait.events[0].event, wait.events[0].args);
    // connect to third address to rsvp from
    txn = await rsvpContract
        .connect(address2)
        .createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

    // confirm all of the RSVPs from deployer address since that is event owner since we created event from it
    txn = await rsvpContract.confirmAllAttendees(eventID);
    wait = await txn.wait();
    wait.events.forEach((event) =>
        console.log("CONFIRMED:", event.args.attendeeAddress)    
    );
    
    // wait 10 years to ensure enough time has passed where event owner can withdraw eth
    await hre.network.provider.send("evm_increaseTime", [15778800000000]);
    txn = await rsvpContract.withdrawUnclaimedDeposits(eventID);
    wait = await txn.wait();
    console.log("WITHDRAWN:", wait.events[0].event, wait.events[0].args)
};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

runMain();