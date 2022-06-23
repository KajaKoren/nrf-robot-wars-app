export const AngleLine = ({
	id,
	xMm,
	yMm,

	rotationDeg,
	currentAngle,
}: //onRotate,
{
	id: string
	xMm: number
	yMm: number
	rotationDeg: number
	currentAngle: number
	//onRotate: (rotateDeg: number) => void
}) => {
	return (
		<div>
			<line
				style={{ stroke: 'black', strokeOpacity: 0.7, strokeDasharray: 5 }}
				x1={xMm}
				y1={yMm}
				x2={xMm + 100 * Math.cos(currentAngle * (Math.PI / 180))}
				y2={yMm + 100 * Math.sin(currentAngle * (Math.PI / 180))}
			/>
			<line
				style={{ stroke: 'black', strokeOpacity: 0.7, strokeDasharray: 5 }}
				x1={xMm}
				y1={yMm}
				x2={xMm + 100 * Math.cos(rotationDeg * (Math.PI / 180))}
				y2={yMm + 100 * Math.sin(rotationDeg * (Math.PI / 180))}
			/>
		</div>
	)
}
