#!/usr/bin/env node

// begining of packet
const SYNC_BYTE = 0x47;

// Size of packet is 188
const PACKET_SIZE = 188;
// First byte is sync byte
const SYNC_BYTE_OFFSET = 0;
const PID_SECOND_BYTE_OFFSET = 1;
const PID_THIRD_BYTE_OFFSET = 2;

const pidSet = new Set();
let isError = false;

let packetIndex = 0;
let byteOffset = 0;

// Store chunks of data
const inputChunks = [];

process.stdin.on('data', (chunk) => {
  inputChunks.push(chunk);
});

process.stdin.on('end', () => {
  const inputData = Buffer.concat(inputChunks);
  const packets = new Uint8Array(inputData.buffer);

  for (let i = 0; i < packets.length; i += PACKET_SIZE) {
    const packet = packets.slice(i, i + PACKET_SIZE);

    if (packet.length < PACKET_SIZE) {
      // discard the packet
      break;
    }

    // Check if packet contains a sync byte in the begining of offset 0
    if (packet[SYNC_BYTE_OFFSET] !== SYNC_BYTE) {
      console.error(`Error: No sync byte present in packet ${packetIndex}, offset ${byteOffset}`);
      isError = true;
      process.exit(1);
    }

    // Mask lower 5 bits of second byte
    const secondByte = (packet[PID_SECOND_BYTE_OFFSET] & 0x1F);
    const thirdBye =  packet[PID_THIRD_BYTE_OFFSET];
    const pid = (secondByte << 8) | thirdBye;
    pidSet.add(pid);

    packetIndex++;
    byteOffset += PACKET_SIZE;
  }

  if (!isError) {
    const sortedPids = Array.from(pidSet).sort((a, b) => a - b);
    for (const pid of sortedPids) {
      const pidString = pid.toString(16)
      console.log(`0x${pidString}`);
    }
  }

  process.exit(isError ? 1 : 0);
});