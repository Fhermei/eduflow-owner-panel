DC = docker compose

.PHONY: help build up down restart logs ps shell dbshell migrate makemigrations superuser test clean prune

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

build: ## Build the image
	$(DC) build

up: ## Start in foreground
	$(DC) up

upd: ## Start in background
	$(DC) up -d

down: ## Stop containers
	$(DC) down

restart: ## Restart the web service
	$(DC) restart owner-panel-web

logs: ## Tail logs
	$(DC) logs -f

ps: ## Show running containers
	$(DC) ps

shell: ## Django shell
	$(DC) exec owner-panel-web python manage.py shell

bash: ## Bash shell inside container
	$(DC) exec owner-panel-web bash

migrate: ## Run migrations
	$(DC) exec owner-panel-web python manage.py migrate --noinput

makemigrations: ## Generate migrations
	$(DC) exec owner-panel-web python manage.py makemigrations

superuser: ## Create a superuser (owner login)
	$(DC) exec owner-panel-web python manage.py createsuperuser

test: ## Run tests
	$(DC) exec owner-panel-web python manage.py test

clean: ## Stop containers and remove volumes (destroys local DB data!)
	$(DC) down -v

prune: ## Remove dangling images
	docker image prune -f
