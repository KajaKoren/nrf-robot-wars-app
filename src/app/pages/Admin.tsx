import style from 'app/pages/Game.module.css'
import { Field } from 'components/Game/Field'
import { Robot } from 'components/Game/Robot'
import { useGameAdmin } from 'hooks/useGameAdmin'
import { useGameController } from 'hooks/useGameController'
import { useEffect, useState } from 'react'

const randomColor = () =>
	`#${Math.floor(Math.random() * 16777215)
		.toString(16)
		.padEnd(6, '0')}`

type RobotFieldConfig = Record<
	string,
	{
		xMm: number
		yMm: number
		colorHex: string
		rotationDeg: number
	}
>

export const Admin = () => {
	const fieldWidthMm = 1500
	const fieldHeightMm = 1000
	const startZoneSizeMm = 100
	const robotWidthMM = 65
	const robotLengthMm = 90

	const {
		metaData: { robotTeamAssignment, robotFieldPosition },
		setRobotPosition,
	} = useGameAdmin()

	const { gameState } = useGameController()

	const [robots, setRobots] = useState<RobotFieldConfig>({})

	useEffect(() => {
		const defaultRobotConfig: RobotFieldConfig = {}
		for (const robot of Object.values(gameState.robots)) {
			defaultRobotConfig[robot.mac] = {
				xMm: Math.random() * fieldWidthMm,
				yMm: Math.random() * fieldHeightMm,
				colorHex: randomColor(),
				rotationDeg: 0,
			}
		}
		setRobots(defaultRobotConfig)
	}, [gameState])

	const [count, setCount] = useState<number>(0)
	console.log({
		robotFieldPosition,
		robots: gameState.robots,
	})

	return (
		<div className={style.field}>
			<Field
				heightMm={fieldHeightMm}
				widthMm={fieldWidthMm}
				numberOfHelperLines={3}
				startZoneSizeMm={startZoneSizeMm}
				onClick={({ xMm, yMm }) => {
					console.log('Clicked on field', { xMm, yMm })
				}}
			>
				{Object.values(gameState.robots).map(({ mac: id }) => {
					const { xMm, yMm, colorHex, rotationDeg } = robots[id]
					return (
						<Robot
							key={id}
							id={id}
							xMm={xMm}
							yMm={yMm}
							widthMm={robotWidthMM}
							heightMm={robotLengthMm}
							colorHex={colorHex}
							rotationDeg={rotationDeg}
							onRotate={(rotation) => {
								setRobots((robots) => ({
									...robots,
									[id]: {
										...robots[id],
										rotationDeg: rotationDeg + rotation,
									},
								}))
							}}
						/>
					)
				})}
			</Field>
		</div>
	)
}
