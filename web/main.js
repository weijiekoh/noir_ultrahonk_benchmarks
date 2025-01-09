import { UltraHonkBackend, BarretenbergVerifier as Verifier } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';

import circuit_10 from '../circuits/2^10.json';
import circuit_11 from '../circuits/2^11.json';
import circuit_12 from '../circuits/2^12.json';
import circuit_13 from '../circuits/2^13.json';
import circuit_14 from '../circuits/2^14.json';
import circuit_15 from '../circuits/2^15.json';
import circuit_16 from '../circuits/2^16.json';
import circuit_17 from '../circuits/2^17.json';
import circuit_18 from '../circuits/2^18.json';
import circuit_19 from '../circuits/2^19.json';
import circuit_ecdsa_secp256k1 from '../circuits/ecdsa_secp256k1.json';
import ecdsa_secp256k1_input from '../circuits/ecdsa_secp256k1_input.json';

const circuits = {
    10: circuit_10,
    11: circuit_11,
    12: circuit_12,
    13: circuit_13,
    14: circuit_14,
    15: circuit_15,
    16: circuit_16,
    17: circuit_17,
    18: circuit_18,
    19: circuit_19,
    ecdsa_secp256k1: circuit_ecdsa_secp256k1,
};

const start = 10;
const end = 20;

function round(num, precision) {
    const factor = 10 ** precision
    return Math.round(num * factor) / factor
}

async function calculateProofs(log_size, circuit, input) {
    const numRuns = 1;
    const backend = new UltraHonkBackend(circuit.bytecode)
    const noir = new Noir(circuit);

    if (input === null) {
        input = { x: 1, y: 2 };
    }

    const startWitnessCalc = Date.now();
    const { witness } = await noir.execute(input);
    const endWitnessCalc = Date.now();

    const timeTakenWitnessCalc = (((endWitnessCalc - startWitnessCalc) / numRuns) / 1000).toString()

    const witnessCalcTimeComponent = document.getElementById('witness_calc_' + log_size)
    witnessCalcTimeComponent.innerHTML = round(timeTakenWitnessCalc, 3)

    const startProofGen = Date.now();
    const proof = await backend.generateProof(witness);
    const endProofGen = Date.now();

    const timeTakenProofGen = (((endProofGen - startProofGen) / numRuns) / 1000).toString()
    const proofGenTimeComponent = document.getElementById('proofgen_time' + log_size)
    proofGenTimeComponent.innerHTML = round(timeTakenProofGen, 3)

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
            await calculateProofs(i, circuits[i], null)
        }
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
}

function appendRow(i, tbody, isCircuitSize, input) {
    const tr = document.createElement("tr")

    const tdG = document.createElement("td")
    const genProofBtn = document.createElement("button")
    genProofBtn.className = "gen_proof_btn"
    genProofBtn.innerHTML = "Generate"
    genProofBtn.addEventListener("click", async () => {
        setBtnStatus(false)
        await calculateProofs(i, circuits[i], input)
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
