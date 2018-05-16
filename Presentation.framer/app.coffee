rootLayers = Framer.CurrentContext.rootLayers

flow = new FlowComponent
flow.showNext(rootLayers[0])

next = =>
	index = flow.stack.length - 1
	nextLayer = rootLayers[index + 1]
	flow.showNext(nextLayer) if nextLayer

previous = =>
	flow.showPrevious() if flow.stack.length > 1

rootLayers.forEach (l) ->
	l.onClick (e) ->
		rightSide = e.point.x > Screen.width / 2
		if rightSide then next() else previous()

class Keys
	@spacebar = 32
	@left = 37
	@right = 39

Framer.CurrentContext.domEventManager.wrap(window).addEventListener "keydown", (event) =>
	switch event.which
		when Keys.spacebar, Keys.right then next(); event.preventDefault()
		when Keys.left then previous(); event.preventDefault()
