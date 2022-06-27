import {
	GetThingShadowCommand,
	IoTDataPlaneClient,
} from '@aws-sdk/client-iot-data-plane'
import type { Static } from '@sinclair/typebox'
import {
	ReportedGameState,
	updateGameController,
} from 'api/updateGameController'
import {
	MacAddress,
	validateGameControllerShadow,
} from 'api/validateGameControllerShadow'
import type { RobotCommand } from 'app/pages/Game'
import equal from 'fast-deep-equal'
import { useCredentials } from 'hooks/useCredentials'
import { useGameControllerThing } from 'hooks/useGameControllerThing.js'
import {
	createContext,
	FunctionComponent,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react'

type ReportedGameStateWithMac = ReportedGameState & {
	robots: Record<
		Static<typeof MacAddress>,
		{
			mac: Static<typeof MacAddress>
		}
	>
}

/**
 * This is a *sample* robot configuration that simulates what the Gateway would report.
 * FIXME: remove once the Gateway actually sends data
 */
const exampleRobots: ReportedGameStateWithMac['robots'] = {
	'00:25:96:FF:FE:12:34:51': {
		angleDeg: 0,
		driveTimeMs: 0,
		mac: '00:25:96:FF:FE:12:34:51',
		revolutionCount: 0,
	},
	'00:25:96:FF:FE:12:34:52': {
		angleDeg: 0,
		driveTimeMs: 0,
		mac: '00:25:96:FF:FE:12:34:52',
		revolutionCount: 0,
	},
	'00:25:96:FF:FE:12:34:53': {
		angleDeg: 0,
		driveTimeMs: 0,
		mac: '00:25:96:FF:FE:12:34:53',
		revolutionCount: 0,
	},
	'00:25:96:FF:FE:12:34:54': {
		angleDeg: 0,
		driveTimeMs: 0,
		mac: '00:25:96:FF:FE:12:34:54',
		revolutionCount: 0,
	},
	'00:25:96:FF:FE:12:34:55': {
		angleDeg: 0,
		driveTimeMs: 0,
		mac: '00:25:96:FF:FE:12:34:55',
		revolutionCount: 0,
	},
	'00:25:96:FF:FE:12:34:56': {
		angleDeg: 0,
		driveTimeMs: 0,
		mac: '00:25:96:FF:FE:12:34:56',
		revolutionCount: 0,
	},
	'00:25:96:FF:FE:12:34:57': {
		angleDeg: 0,
		driveTimeMs: 0,
		mac: '00:25:96:FF:FE:12:34:57',
		revolutionCount: 0,
	},
	'00:25:96:FF:FE:12:34:58': {
		angleDeg: 0,
		driveTimeMs: 0,
		mac: '00:25:96:FF:FE:12:34:58',
		revolutionCount: 0,
	},
}

export const GameControllerContext = createContext<{
	gameState: ReportedGameStateWithMac
	nextRoundCommands: (commands: RobotCommand[]) => void
	setAutoUpdate: (update: boolean) => void
}>({
	gameState: {
		round: 1,
		robots: {},
	},
	nextRoundCommands: () => undefined,
	setAutoUpdate: () => undefined,
})

export const useGameController = () => useContext(GameControllerContext)

export const GameControllerProvider: FunctionComponent<{
	children: ReactNode
}> = ({ children }) => {
	const [gameState, setGameState] = useState<ReportedGameStateWithMac>({
		round: 1,
		robots: exampleRobots,
	})
	const { thingName: gameControllerThing } = useGameControllerThing()
	const [autoUpdate, setAutoUpdate] = useState<boolean>(true)
	const { accessKeyId, secretAccessKey, region } = useCredentials()

	let iotDataPlaneClient: IoTDataPlaneClient | undefined = undefined
	let commandHandler: (commands: RobotCommand[]) => void = () => undefined

	if (accessKeyId === undefined || secretAccessKey === undefined) {
		console.debug('AWS credentials not available')
	} else {
		iotDataPlaneClient = new IoTDataPlaneClient({
			region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		})
	}

	if (iotDataPlaneClient !== undefined && gameControllerThing !== undefined) {
		commandHandler = updateGameController({
			iotData: iotDataPlaneClient,
			controllerThingName: gameControllerThing,
		})
	}

	// If a game controller thing is found, fetch the robot configuration
	useEffect(() => {
		if (gameControllerThing === undefined) return
		if (iotDataPlaneClient === undefined) return

		const i = setInterval(() => {
			if (!autoUpdate) return
			;(iotDataPlaneClient as IoTDataPlaneClient)
				.send(
					new GetThingShadowCommand({
						thingName: gameControllerThing,
					}),
				)
				.then(({ payload }) => JSON.parse(new TextDecoder().decode(payload)))
				.then((shadow) => {
					const maybeValidShadow = validateGameControllerShadow(shadow)
					if ('error' in maybeValidShadow) {
						// Validation failed
						console.error(maybeValidShadow.error)
						console.debug(maybeValidShadow.error.details)
						return
					}
					// Game shadow is valid
					const newGameSate: ReportedGameStateWithMac = {
						round: maybeValidShadow.state.reported.round ?? gameState.round,
						robots: Object.entries(
							maybeValidShadow.state.reported.robots ?? gameState.robots,
						)
							.map(([mac, robot]) => ({
								...robot,
								mac,
							}))
							.reduce(
								(robots, robot) => ({
									...robots,
									[robot.mac]: robot,
								}),
								{} as ReportedGameStateWithMac['robots'],
							),
					}
					if (!equal(newGameSate, gameState)) setGameState(newGameSate)
				})
				.catch((error) => {
					console.error('Failed to get shadow')
					console.error(error)
				})
		}, 2000)

		return () => {
			clearInterval(i)
		}
	}, [gameControllerThing, gameState, autoUpdate, iotDataPlaneClient])

	return (
		<GameControllerContext.Provider
			value={{
				gameState,
				nextRoundCommands: commandHandler,
				setAutoUpdate,
			}}
		>
			{children}
		</GameControllerContext.Provider>
	)
}
