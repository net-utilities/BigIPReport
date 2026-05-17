# =============================================================================
# This Makefile is NOT the supported production install path. It exists so
# contributors can lint, render, and test repo resources locally
#
# Prerequisites: helm, kubectl (for install), and a cluster context you intend
# to use for testing.
#
# Common overrides:
#   make helm-install
#   make helm-uninstall
#   make helm-install HELM_RELEASE=myrel HELM_NAMESPACE=dev
#   make helm-template HELM_VALUES=helm/values.yaml
#
# Local install defaults use config/ (gitignored): values.test.yaml and bigipreportconfig.xml
# =============================================================================

.DEFAULT_GOAL := help

ROOT_DIR       := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
HELM_CHART     := $(ROOT_DIR)helm
HELM_RELEASE    ?= bigipreport
HELM_NAMESPACE  ?= bigipreport
CONFIG_DIR        ?= $(ROOT_DIR)config
HELM_VALUES       ?= $(CONFIG_DIR)/values.test.yaml
HELM_OUTPUT       ?= $(ROOT_DIR)build/helm

CONFIG_SRC        := $(CONFIG_DIR)/bigipreportconfig.xml
HELM_CONFIG       := --set-file config.xml=$(CONFIG_SRC)
KUBECTL           := kubectl --namespace '$(HELM_NAMESPACE)'
HELM              := helm
HELM_POD_LABELS := app.kubernetes.io/instance=$(HELM_RELEASE)
LOG_TAIL          ?= 100

.PHONY: help check-helm check-kubectl check-config check-helm-values \
        helm-lint helm-template helm-template-file helm-images \
        helm-install helm-upgrade helm-uninstall helm-clean-jobs \
        helm-describe-frontend helm-describe-data-collector \
        helm-logs-frontend helm-logs-data-collector docker-reset

help: ## Show testing targets for the Helm chart
	@echo "BigIPReport — Helm chart testing (local repo only; not for production)"
	@echo ""
	@grep -E '^[a-zA-Z0-9_.-]+:.*## ' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  %-22s %s\n", $$1, $$2}'
	@echo ""
	@echo "Defaults: release=$(HELM_RELEASE) namespace=$(HELM_NAMESPACE)"
	@echo "          values=$(HELM_VALUES) config=$(CONFIG_SRC)"

check-helm: ## Verify helm is on PATH
	@command -v helm >/dev/null 2>&1 || { \
		echo "error: helm is required (https://helm.sh/docs/intro/install/)"; \
		exit 1; \
	}

check-kubectl: ## Verify kubectl is on PATH
	@command -v kubectl >/dev/null 2>&1 || { \
		echo "error: kubectl is required for cluster install/uninstall"; \
		exit 1; \
	}

check-config: ## Verify config/bigipreportconfig.xml exists (for --set-file)
	@test -f '$(CONFIG_SRC)' || { \
		echo "error: missing $(CONFIG_SRC)"; \
		echo "  copy and edit: cp data-collector/bigipreportconfig.xml $(CONFIG_SRC)"; \
		exit 1; \
	}

check-helm-values: ## Verify config/values.test.yaml exists
	@test -f '$(HELM_VALUES)' || { \
		echo "error: missing $(HELM_VALUES)"; \
		echo "  copy from helm/values.yaml and customize for your cluster"; \
		exit 1; \
	}

helm-lint: check-helm check-config ## Run helm lint against the chart
	helm lint '$(HELM_CHART)' -f '$(HELM_VALUES)' $(HELM_CONFIG)

helm-images: check-helm check-config ## Show image refs that would be deployed (uses $(HELM_VALUES))
	@helm template '$(HELM_RELEASE)' '$(HELM_CHART)' \
		-f '$(HELM_VALUES)' \
		$(HELM_CONFIG) \
		--namespace '$(HELM_NAMESPACE)' \
		| grep -E '^\s+image:'

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

helm-install: check-helm check-kubectl check-helm-values check-config helm-lint ## Install or upgrade bigipreport (config/values.test.yaml + config/bigipreportconfig.xml)
	@echo "Images:"; $(MAKE) --no-print-directory helm-images
	$(HELM) upgrade --install '$(HELM_RELEASE)' '$(HELM_CHART)' \
		-f '$(HELM_VALUES)' \
		$(HELM_CONFIG) \
		--namespace '$(HELM_NAMESPACE)' \
		--create-namespace \
		--reset-values
	@$(MAKE) --no-print-directory helm-clean-jobs

helm-clean-jobs: check-kubectl ## Delete finished data-collector Jobs (clears stale pods still on old image tags)
	@$(KUBECTL) delete jobs -l '$(HELM_POD_LABELS),app.kubernetes.io/component=data-collector' --ignore-not-found

helm-upgrade: helm-install ## Alias for helm-install (idempotent upgrade --install)

helm-uninstall: check-helm check-kubectl ## Remove the bigipreport release from your test cluster
	$(HELM) uninstall '$(HELM_RELEASE)' --namespace '$(HELM_NAMESPACE)'

helm-describe-frontend: check-kubectl ## kubectl describe frontend pods for this release
	$(KUBECTL) describe pods -l '$(HELM_POD_LABELS),app.kubernetes.io/component=frontend'

helm-describe-data-collector: check-kubectl ## kubectl describe data-collector job pods for this release
	$(KUBECTL) describe pods -l '$(HELM_POD_LABELS),app.kubernetes.io/component=data-collector'

helm-logs-frontend: check-kubectl ## kubectl logs from frontend pods (LOG_TAIL=100; add ARGS=-f to follow)
	$(KUBECTL) logs -l '$(HELM_POD_LABELS),app.kubernetes.io/component=frontend' --tail=$(LOG_TAIL) $(ARGS)

helm-logs-data-collector: check-kubectl ## kubectl logs from data-collector job pods (LOG_TAIL=100; ARGS=-f to follow)
	$(KUBECTL) logs -l '$(HELM_POD_LABELS),app.kubernetes.io/component=data-collector' --tail=$(LOG_TAIL) --prefix $(ARGS)

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
