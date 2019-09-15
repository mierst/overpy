.PHONY: build
BOT_TOKEN ?= foo 

build:
	docker build -t overpy .

rebuild:
	docker build --no-cache -t overpy .

run:
	docker run --name overpy -d -e BOT_TOKEN=$(BOT_TOKEN) overpy

stop:
	docker stop overpy

clean:
	docker system prune -f
