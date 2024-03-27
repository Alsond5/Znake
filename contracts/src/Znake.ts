import { Field, SmartContract, state, State, method, ZkProgram, MerkleMapWitness, UInt32, Poseidon } from 'o1js';
import { Controller } from './GameLogic/Controller.js';

export const { verificationKey } = await Controller.compile();

export class ZnakeProof extends ZkProgram.Proof(Controller) {}

export class Znake extends SmartContract {
  @state(Field) scores = State<Field>();

  @method initState(initialScores: Field) {
    super.init();

    this.scores.set(initialScores);
  }
  
  public getScores(): Field {
    return this.scores.get();
  }

  @method update(proof: ZnakeProof, witness: MerkleMapWitness, score: UInt32) {
    proof.verify();
    
    const player = proof.publicOutput.player;
    this.sender.assertEquals(player);

    const currentScores = this.scores.getAndRequireEquals();
    const initialScores = proof.publicInput;

    currentScores.assertEquals(initialScores);
    
    const hashedPlayerAddress = Poseidon.hash(player.toFields());
    const scoreField = score.toFields()[0];

    const [beforeRoot, key] = witness.computeRootAndKey(scoreField);
    currentScores.assertEquals(beforeRoot);
    hashedPlayerAddress.assertEquals(key);
    
    const newScore = proof.publicOutput.score;
    const newScoreField = newScore.toFields()[0];

    const [afterRoot, newKey] = witness.computeRootAndKey(newScoreField);

    this.scores.set(afterRoot);
  }
}
