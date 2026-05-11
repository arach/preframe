import { Composition, registerRoot } from 'remotion'
import { HermesDemo, HERMES_DEMO_FRAMES } from './HermesDemo'

const Root: React.FC = () => (
  <Composition
    id="HermesDemo"
    component={HermesDemo}
    durationInFrames={HERMES_DEMO_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
)

registerRoot(Root)
