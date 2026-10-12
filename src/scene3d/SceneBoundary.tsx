import { Component, type ReactNode } from "react"

type Props = {
  children: ReactNode
  onFail: () => void
}

type State = {
  failed: boolean
}

export default class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(): void {
    this.props.onFail()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
