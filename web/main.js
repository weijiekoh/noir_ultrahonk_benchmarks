import { UltraHonkBackend, BarretenbergVerifier as Verifier } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';

import ecdsa_secp256k1_input from '../circuits/ecdsa_secp256k1_input.json';
import compute_merkle_root_depth_4_input from '../circuits/compute_merkle_root_depth_4_input.json';
import compute_merkle_root_depth_32_input from '../circuits/compute_merkle_root_depth_32_input.json';
import keccak256_32B_100_times_input from '../circuits/keccak256_32B_100_times_input.json';
import keccak256_32B_input from '../circuits/keccak256_32B_input.json';
import keccak256_532B_10_times_input from '../circuits/keccak256_532B_10_times_input.json';
import keccak256_532B_input from '../circuits/keccak256_532B_input.json';

const primitiveCircuits = [
    'ecdsa_secp256k1',
    'compute_merkle_root_depth_4',
    'compute_merkle_root_depth_32',
    'keccak256_32B',
    'keccak256_32B_100_times',
    'keccak256_532B',
    'keccak256_532B_10_times',
];

let staticPath = '/static/'
if (!import.meta.env.PROD) {
    staticPath = 'http://localhost:8001/'
}

const start = 10;
const end = 20;

function round(num, precision) {
    const factor = 10 ** precision
    return Math.round(num * factor) / factor
}

async function calculateProofs(log_size, circuitPath, input, threads) {
    const resp = await fetch(circuitPath);
    const circuit = await resp.json();

    // The bytelength of the Base64-encoded circuit
    const circuitSize = circuit.bytecode.length * 6

    const circuitSizeMb = circuitSize / 1024 / 1024

    const circuitSizeComponent = document.getElementById('circuit_size_' + log_size)
    circuitSizeComponent.innerHTML = round(circuitSizeMb, 3)

    const numRuns = 1;
    const backend = new UltraHonkBackend(circuit.bytecode, { threads })
    const noir = new Noir(circuit);

    if (input === null) {
        input = { x: 1, y: 2 };
    }

    // Generate the witness
    const startWitnessCalc = Date.now();
    const { witness } = await noir.execute(input);
    const endWitnessCalc = Date.now();

    const timeTakenWitnessCalc = (((endWitnessCalc - startWitnessCalc) / numRuns) / 1000).toString()

    const witnessCalcTimeComponent = document.getElementById('witness_calc_' + log_size)
    witnessCalcTimeComponent.innerHTML = round(timeTakenWitnessCalc, 3)

    // Generate the proof
    const startProofGen = Date.now();
    const proof = await backend.generateProof(witness);
    const endProofGen = Date.now();

    const timeTakenProofGen = (((endProofGen - startProofGen) / numRuns) / 1000).toString()
    const proofGenTimeComponent = document.getElementById('proofgen_time' + log_size)
    proofGenTimeComponent.innerHTML = round(timeTakenProofGen, 3)

    // Verify the proof
    const isValid = await backend.verifyProof(proof)
    const resultComponent = document.getElementById('valid_' + log_size)

    resultComponent.innerHTML = isValid;
}

function setBtnStatus(enabled) {
    const genProofBtns = document.getElementsByClassName('gen_proof_btn')
    for (let i = 0; i < genProofBtns.length; i++) {
        genProofBtns[i].disabled = !enabled
    }
}

async function main() {
    // Build the main table
    const mainDiv = document.getElementById("main")

    const p = document.createElement("p")
    const genAllBtn = document.createElement("button")
    genAllBtn.className = "gen_proof_btn"
    genAllBtn.innerHTML = "Generate all"
    genAllBtn.addEventListener("click", async () => {
        setBtnStatus(false)
        for (let i = start; i < end; i++) {
            const circuitPath = staticPath + '2^' + i + '.json'
            await calculateProofs(i, circuitPath, null, navigator.hardwareConcurrency)
        }

        for (let i = 0; i < primitiveCircuits.length; i++) {
            const circuitPath = staticPath + primitiveCircuits[i] + '.json'
            const input = await fetch(staticPath + primitiveCircuits[i] + '_input.json').then(r => r.json())
            await calculateProofs(primitiveCircuits[i], circuitPath, input, navigator.hardwareConcurrency)
        }

        // TODO: do so for primitive circuits
        setBtnStatus(true)
    })
    p.appendChild(genAllBtn)
    mainDiv.appendChild(genAllBtn)

    // Insert a table into mainDiv
    const table = document.createElement("table")
    mainDiv.appendChild(table)

    // Table header
    const thead = document.createElement("thead")
    table.appendChild(thead)
    const theadTr = document.createElement("tr")

    const thGenProof = document.createElement("th")
    thGenProof.innerHTML = "Generate proof"
    theadTr.appendChild(thGenProof)

    const th0 = document.createElement("th")
    th0.innerHTML = "Circuit"
    theadTr.appendChild(th0)

    const thCircuitSize = document.createElement("th")
    thCircuitSize.innerHTML = "Bytecode size (MB)"
    theadTr.appendChild(thCircuitSize)

    const thWitnessCalc = document.createElement("th")
    thWitnessCalc.innerHTML = "Witness computation (s)"
    theadTr.appendChild(thWitnessCalc)

    const thProofGen = document.createElement("th")
    thProofGen.innerHTML = "Proof generation (s)"
    theadTr.appendChild(thProofGen)

    const thValid = document.createElement("th")
    thValid.innerHTML = "Proof valid?"
    theadTr.appendChild(thValid)
    thead.appendChild(theadTr)

    const tbody = document.createElement("tbody")
    table.appendChild(tbody)

    for (let i = start; i < end; i++) {
        appendRow(i, tbody, true, null)
    }

    appendRow("ecdsa_secp256k1", tbody, false, ecdsa_secp256k1_input)
    appendRow("compute_merkle_root_depth_4", tbody, false, compute_merkle_root_depth_4_input)
    appendRow("compute_merkle_root_depth_32", tbody, false, compute_merkle_root_depth_32_input)
    appendRow("keccak256_32B", tbody, false, keccak256_32B_input)
    appendRow("keccak256_32B_100_times", tbody, false, keccak256_32B_100_times_input)
    appendRow("keccak256_532B", tbody, false, keccak256_532B_input)
    appendRow("keccak256_532B_10_times", tbody, false, keccak256_532B_10_times_input)
}

function appendRow(i, tbody, isCircuitSize, input) {
    const tr = document.createElement("tr")

    const tdG = document.createElement("td")
    const genProofBtn = document.createElement("button")
    genProofBtn.className = "gen_proof_btn"
    genProofBtn.innerHTML = "Generate"
    genProofBtn.addEventListener("click", async () => {
        let circuitPath = staticPath + '2^' + i + '.json'
        if (!isCircuitSize) {
            circuitPath = staticPath + i + '.json'
        }

        setBtnStatus(false)
        await calculateProofs(i, circuitPath, input)
        setBtnStatus(true)
    })
    tdG.appendChild(genProofBtn)
    tr.appendChild(tdG)
    tbody.appendChild(tr)

    const tdConstraints = document.createElement("td")

    if (isCircuitSize) {
        tdConstraints.innerHTML = 2 ** i
    } else {
        tdConstraints.innerHTML = i
    }
    tr.appendChild(tdConstraints)
    tbody.appendChild(tr)

    const tdCircuitSize = document.createElement("td")
    tdCircuitSize.id = "circuit_size_" + i
    tr.appendChild(tdCircuitSize)
    tbody.appendChild(tr)

    const tdWitnessCalc = document.createElement("td")
    tdWitnessCalc.id = "witness_calc_" + i
    tr.appendChild(tdWitnessCalc)
    tbody.appendChild(tr)

    const tdProofGen = document.createElement("td")
    tdProofGen.id = "proofgen_time" + i
    tr.appendChild(tdProofGen)
    tbody.appendChild(tr)

    const tdValid = document.createElement("td")
    tdValid.id = "valid_" + i
    tr.appendChild(tdValid)
    tbody.appendChild(tr)
}

main();
