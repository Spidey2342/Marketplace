import * as THREE from "three"
import { CLIP, CROSSFADE_S, type CharacterLod } from "@/scene3d/characters/constants"

type Locomotion = "idle" | "walk" | "run"

const RUN_SPEED = 2.4
const WALK_SPEED = 0.15

export class CharacterAnimator {
  readonly mixer: THREE.AnimationMixer
  private readonly actions = new Map<string, THREE.AnimationAction>()
  private locomotion: Locomotion = "idle"
  private locomotionAction: THREE.AnimationAction | null = null
  private farClock = 0

  constructor(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root)
    for (const clip of clips) {
      const key = clip.name.trim() || CLIP.walk
      this.actions.set(key, this.mixer.clipAction(clip))
    }
    const walk = this.actions.get(CLIP.walk) ?? this.actions.values().next().value
    if (walk) {
      this.actions.set(CLIP.idle, walk)
      this.actions.set(CLIP.run, walk)
      walk.play()
      this.locomotionAction = walk
    }
  }

  update(delta: number, speed: number, lod: CharacterLod, animated: boolean) {
    let step = delta
    if (lod === "street-far") {
      this.farClock += delta
      if (this.farClock < 0.1) return
      step = this.farClock
      this.farClock = 0
      if (!animated) return
    } else if (!animated) {
      step = 0
    }

    const target: Locomotion =
      speed > RUN_SPEED ? "run" : speed > WALK_SPEED ? "walk" : "idle"
    if (target !== this.locomotion) {
      this.crossfadeLocomotion(target)
      this.locomotion = target
    }

    const action = this.locomotionAction
    if (action) {
      if (target === "run") action.timeScale = 1.35
      else if (target === "walk") action.timeScale = 1
      else action.timeScale = 0.05
    }

    this.mixer.update(step)
  }

  playEmote(label: string) {
    const key = label.toLowerCase().includes("ei") ? CLIP.wave : CLIP.cheer
    this.playOneShot(key, 1.8)
  }

  playOneShot(name: string, duration = 1.4) {
    const clip = this.actions.get(name)
    if (!clip) return
    clip.reset()
    clip.setLoop(THREE.LoopOnce, 1)
    clip.clampWhenFinished = true
    clip.fadeIn(CROSSFADE_S)
    clip.play()
    window.setTimeout(() => {
      clip.fadeOut(CROSSFADE_S)
      this.crossfadeLocomotion(this.locomotion)
    }, duration * 1000)
  }

  dispose() {
    this.mixer.stopAllAction()
  }

  private crossfadeLocomotion(next: Locomotion) {
    const clipName = next === "run" ? CLIP.run : next === "walk" ? CLIP.walk : CLIP.idle
    const nextAction = this.actions.get(clipName)
    if (!nextAction) return
    nextAction.reset()
    nextAction.setLoop(THREE.LoopRepeat, Infinity)
    nextAction.clampWhenFinished = false
    nextAction.enabled = true
    nextAction.setEffectiveWeight(1)
    if (this.locomotionAction && this.locomotionAction !== nextAction) {
      this.locomotionAction.crossFadeTo(nextAction, CROSSFADE_S, false)
    } else {
      nextAction.fadeIn(CROSSFADE_S)
    }
    nextAction.play()
    this.locomotionAction = nextAction
  }
}
