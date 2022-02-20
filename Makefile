# For CPTR-405 Organization of Programming Languages Assignment 1
# Miro Manestar, February 2nd, 2022

lox:
	@npm ci
	@printf "#!/bin/sh\n npm run --silent lox rpn no-output" > mylox
	@chmod +x mylox
	@echo "Done."

mylox053:
	@echo "Compiling mylox053..."
	lox

mylox062:
	@echo "Compiling mylox062..."
	lox

mylox071:
	@echo "Compiling mylox071..."
	lox

challenge081:
	@echo "Compiling challenge081..."
	lox

challenge08O:
	@echo "Compiling challenge08O..."
	lox

challenge093:
	@echo "Compiling challenge093..."
	lox

challenge09O:
	@echo "Compiling challenge09O..."
	lox