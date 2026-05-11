import { Composition, registerRoot } from 'remotion'
import { MiraDemoTreatment1, MIRA_DEMO_FRAMES } from './MiraDemoTreatment1'

const Root: React.FC = () => (
  <Composition
    id="MiraDemoTreatment1"
    component={MiraDemoTreatment1}
    durationInFrames={MIRA_DEMO_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
)

registerRoot(Root)
