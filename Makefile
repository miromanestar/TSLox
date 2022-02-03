# For CPTR-405 Organization of Programming Languages Assignment 1
# Miro Manestar, February 2nd, 2022

mylox053:
	@echo "Compiling mylox053..."
	@npm ci
	@printf "#!/bin/sh\n npm run --silent lox rpn no-output" > mylox
	@chmod +x mylox
	@echo "Done."

mylox062:
	@echo "Compiling mylox062..."
	@npm ci
	@printf "#!/bin/sh\n npm run --silent lox" > mylox
	@chmod +x mylox
	@echo "Done."

mylox071:
	@echo "Compiling mylox071..."
	@npm ci
	@printf "#!/bin/sh\n npm run --silent lox" > mylox
	@chmod +x mylox
	@echo "Done."