Docker container terminology cheat sheet for real-world conversations.

**Core Concepts**
- Container: A running isolated process with its own filesystem, network stack, and config.
- Image: A read-only template used to create containers.
- Docker Engine: The service that builds/runs images and containers.
- Docker CLI: The command tool you use, like docker run, docker ps.
- Docker Desktop: GUI package for Mac/Windows that includes Docker Engine.
- Registry: Remote image store, like Docker Hub or GitHub Container Registry.
- Repository: Named image collection in a registry, for example nginx.
- Tag: Image version label, for example latest or 1.27-alpine.
- Digest: Immutable image identifier using SHA256.
- Layer: Each image step (from Dockerfile) becomes a cached filesystem layer.
- Build context: Folder sent to Docker daemon during image build.
- Dockerfile: Script that defines how to build an image.

**Image Build Terms**
- Base image: Starting image in FROM line.
- Multi-stage build: Multiple FROM stages to reduce final image size.
- Build cache: Reused layers to speed up rebuilds.
- Cache busting: Forcing a rebuild by changing a step.
- .dockerignore: Excludes files from build context.
- ARG: Build-time variable, not persisted at runtime unless copied into ENV.
- ENV: Runtime environment variable embedded in image/container config.
- COPY: Copies files from context into image.
- ADD: Like COPY, plus URL/tar extras (used less often).
- RUN: Executes command during build, creates a new layer.
- CMD: Default command when container starts.
- ENTRYPOINT: Main executable for the container.
- EXPOSE: Documentation of intended port; does not publish by itself.
- USER: Sets process user inside container.
- WORKDIR: Sets default working directory.
- HEALTHCHECK: Command Docker uses to mark container healthy/unhealthy.
- BuildKit: Newer, faster build backend with better caching/features.

**Container Runtime Terms**
- Create: Prepare container from image without starting.
- Start: Launch the created container.
- Run: Create + start in one command.
- Stop: Graceful termination (SIGTERM then SIGKILL).
- Kill: Immediate termination.
- Restart policy: Auto-restart behavior, like always or unless-stopped.
- Detached mode: Run in background.
- Foreground mode: Attach logs/stdin in current terminal.
- Interactive mode: Keep stdin open for shell-like use.
- TTY: Pseudo terminal allocation.
- Ephemeral container: Temporary container deleted after exit.
- Container ID: Unique identifier for a container.
- Container name: Human-friendly alias.

**Networking Terms**
- Bridge network: Default private network on one host.
- Host network: Container shares host network namespace.
- None network: No networking.
- Overlay network: Multi-host virtual network (Swarm use-case).
- Port publishing: Map host port to container port, like 3000:3000.
- Port mapping conflict: Host port already occupied.
- DNS service discovery: Containers resolve each other by service/container name.
- Loopback confusion: Localhost inside container means the container itself.
- Network alias: Extra DNS name on a network.

**Storage Terms**
- Volume: Docker-managed persistent storage.
- Bind mount: Host path mounted into container.
- Tmpfs mount: In-memory filesystem mount.
- Named volume: Explicitly named volume reusable across containers.
- Anonymous volume: Auto-created unnamed volume.
- Read-only mount: Mount that cannot be written.
- Data persistence: Survives container deletion when using volume/bind mount.
- Copy-on-write: Container writable layer on top of image layers.

**Observability and Debugging Terms**
- Logs: Stdout/stderr from container process.
- Attach: Connect to running process streams.
- Exec: Run a command inside running container.
- Inspect: Detailed JSON metadata for container/image/network/volume.
- Events: Real-time lifecycle events.
- Stats: CPU/memory/network IO usage.
- Health status: starting, healthy, unhealthy from HEALTHCHECK.
- Exit code: Process result code on container exit.
- OOMKilled: Container killed due to out-of-memory.
- CrashLoop-like pattern: Repeated restarts from failing startup command.

**Security Terms**
- Namespace: Kernel isolation for process, network, mount, etc.
- Cgroups: Resource limits/accounting for CPU/memory.
- Capabilities: Fine-grained Linux privileges.
- Privileged container: Elevated permissions; high risk.
- Rootless Docker: Engine/containers run without root privileges.
- Seccomp: Syscall filtering policy.
- AppArmor/SELinux: Mandatory access control profiles.
- Read-only root filesystem: Prevents writes to container root FS.
- Secret: Sensitive value managed separately from image.
- Image scanning: Vulnerability analysis of image packages.

**Resource and Performance Terms**
- CPU limit: Max CPU container can use.
- Memory limit: Max RAM container can use.
- Reservation: Soft resource guarantee.
- Throttling: CPU slow-down when limit exceeded.
- Swap limit: Memory+swap behavior configuration.
- Image size: Final image footprint; impacts pull time/startup.
- Cold start: First startup path (pull, create, initialize).
- Warm start: Restart with image already present/cached.

**Docker Compose Terms**
- Compose: Tool to define multi-container apps in one file.
- Service: Logical container definition in Compose.
- Project: Group of services/networks/volumes under one name.
- Depends_on: Startup dependency ordering (not full readiness unless configured).
- Healthcheck condition: Wait for healthy dependency before starting.
- Override file: Extra compose file for environment-specific changes.
- Profiles: Optional service groups for selective startup.
- Scale: Run multiple replicas of a service.
- Environment file: Centralized variable file for Compose.
- Compose network: Auto-created network shared by services in project.

**Delivery and Operations Terms**
- Pull: Download image from registry.
- Push: Upload image to registry.
- Tagging strategy: Naming/versioning policy, like semver or git SHA.
- Immutable artifact: Built image should not be changed post-build.
- CI/CD pipeline: Automated build/test/push/deploy flow.
- Rollback: Revert to previous known-good image tag.
- Blue-green deployment: Two environments, switch traffic when ready.
- Canary deployment: Gradually route traffic to new version.
- Idempotent deploy: Re-running deploy gives same result safely.

**Terms People Mix Up Often**
- Image vs container: Image is template; container is running instance.
- EXPOSE vs publish: EXPOSE documents port; publish actually opens host mapping.
- ARG vs ENV: ARG for build-time; ENV for runtime.
- Volume vs bind mount: Volume is Docker-managed; bind mount is direct host path.
- Restarted container vs recreated container: Restart keeps writable layer; recreate starts from image + mounts + config.
- Localhost in container vs localhost on host: Different network namespaces.

If you want, I can give you:
1. A beginner version for oral recitation in 2 minutes.
2. A practical version mapped to your Chenda docker-compose.yml so each term is tied to your actual stack.
3. A command cheat sheet that pairs each term with the exact command you use most often.