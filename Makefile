# =============================================================================
# This Makefile is NOT the supported production install path. It exists so
# contributors can lint, render, and test repo resources locally
#
# Prerequisites: helm, kubectl (for install), and a cluster context you intend
# to use for testing.
#
# Common overrides:
#   make helm-install HELM_RELEASE=myrel HELM_NAMESPACE=dev
#   make helm-template HELM_VALUES=helm/values.yaml
# =============================================================================

.DEFAULT_GOAL := help

ROOT_DIR       := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
HELM_CHART     := $(ROOT_DIR)helm
HELM_RELEASE   ?= bigipreport
HELM_NAMESPACE ?= bigipreport
HELM_VALUES    ?= $(HELM_CHART)/test-values.yaml
HELM_OUTPUT    ?= $(ROOT_DIR)build/helm

CONFIG_SRC := $(ROOT_DIR)data-collector/bigipreportconfig.xml
HELM_CONFIG  := --set-file config.xml=$(CONFIG_SRC)

.PHONY: help check-helm check-config helm-lint helm-template helm-template-file \
        helm-install helm-upgrade helm-uninstall docker-reset

help: ## Show testing targets for the Helm chart
	@echo "BigIPReport — Helm chart testing (local repo only; not for production)"
	@echo ""
	@grep -E '^[a-zA-Z0-9_.-]+:.*## ' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  %-22s %s\n", $$1, $$2}'
	@echo ""
	@echo "Defaults: release=$(HELM_RELEASE) namespace=$(HELM_NAMESPACE) values=$(HELM_VALUES)"

check-helm: ## Verify helm is on PATH
	@command -v helm >/dev/null 2>&1 || { \
		echo "error: helm is required (https://helm.sh/docs/intro/install/)"; \
		exit 1; \
	}

check-config: ## Verify bigipreportconfig.xml exists for chart rendering
	@test -f '$(CONFIG_SRC)' || { \
		echo "error: missing $(CONFIG_SRC)"; exit 1; \
	}

helm-lint: check-helm check-config ## Run helm lint against the chart
	helm lint '$(HELM_CHART)' -f '$(HELM_VALUES)' $(HELM_CONFIG)

helm-template: check-helm check-config helm-lint ## Render manifests to stdout
	helm template '$(HELM_RELEASE)' '$(HELM_CHART)' \
		-f '$(HELM_VALUES)' \
		$(HELM_CONFIG) \
		--namespace '$(HELM_NAMESPACE)'

helm-template-file: check-helm check-config helm-lint ## Render manifests to $(HELM_OUTPUT)/manifests.yaml
	@mkdir -p '$(HELM_OUTPUT)'
	helm template '$(HELM_RELEASE)' '$(HELM_CHART)' \
		-f '$(HELM_VALUES)' \
		$(HELM_CONFIG) \
		--namespace '$(HELM_NAMESPACE)' \
		> '$(HELM_OUTPUT)/manifests.yaml'
	@echo "wrote $(HELM_OUTPUT)/manifests.yaml"

helm-install: check-helm check-config helm-lint ## Install or upgrade the chart on your test cluster
	helm upgrade --install '$(HELM_RELEASE)' '$(HELM_CHART)' \
		-f '$(HELM_VALUES)' \
		$(HELM_CONFIG) \
		--namespace '$(HELM_NAMESPACE)' \
		--create-namespace

helm-upgrade: helm-install ## Alias for helm-install (idempotent upgrade --install)

helm-uninstall: check-helm ## Remove the test release from the cluster
	helm uninstall '$(HELM_RELEASE)' --namespace '$(HELM_NAMESPACE)'

docker-reset: ## Stop docker compose and remove volumes (prompts; deletes all report data)
	@set -e; \
	cd '$(ROOT_DIR)'; \
	command -v docker >/dev/null 2>&1 || { echo "error: docker is required" >&2; exit 1; }; \
	docker compose version >/dev/null 2>&1 || { echo "error: docker compose is required" >&2; exit 1; }; \
	printf '%s\n' \
		"" \
		"*** WARNING: docker-reset will destroy all local compose data ***" \
		"" \
		"This stops the BigIPReport stack and removes the json-data volume (all JSON / .br report files)" \
		"" \
		"This cannot be undone. You will need to run a new data collector after starting again." \
		""; \
	read -r -p "Press Enter to continue, or Ctrl+C to cancel: " _ </dev/tty; \
	echo "Stopping containers and removing volumes..."; \
	docker compose down -v --remove-orphans; \
	echo "Done. Start again with: docker compose up -d --build"
