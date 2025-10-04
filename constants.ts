import type { FileContent } from './types';

export const FILE_GENERATION_PROMPTS = [
  {
    name: 'README.md',
    language: 'markdown',
    description: `Generate a comprehensive README.md file for a project that uses an AI agent to build a minimal Linux OS with Buildroot. The README should first explain "How to Customize Your Linux System" by editing 'configs/tiny_linux_defconfig' and a kernel fragment file. It should then list prerequisites like build-essential and QEMU. Finally, provide a "Quick Start" section explaining the steps: Generate, Setup, Build, and Test.`
  },
  {
    name: 'scripts/setup.sh',
    language: 'bash',
    description: `Generate a bash script 'scripts/setup.sh'. It must be robust and path-aware, defining a PROJECT_ROOT variable based on the script's location. It must start with 'set -e'. The script needs to create the following directories relative to PROJECT_ROOT: buildroot/, configs/, board/, output/, scripts/. It should also create a readme.txt inside the 'board/' directory. Finally, it must clone the latest stable branch of Buildroot (e.g., 2024.02.x) into the 'buildroot/' directory.`
  },
  {
    name: 'configs/tiny_linux_defconfig',
    language: 'makefile',
    description: `Generate a Buildroot '.config' file named 'tiny_linux_defconfig'. It must be the absolute minimum to boot a shell on x86_64.
    - Set target architecture to x86_64.
    - Use the default Buildroot glibc toolchain.
    - Use BusyBox as the init system.
    - Critically, include 'BR2_PACKAGE_BUSYBOX_STATIC_LINK=y' to prevent linking issues.
    - Do NOT include any 'BR2_BUSYBOX_CONFIG_FRAGMENT_FILES' lines.
    - Configure the output to be a compressed cpio initial ramdisk (initramfs).
    - Enable the Linux kernel, using the latest stable version and 'tinyconfig' as a base.
    - Do NOT include any bootloader like GRUB.
    - Specify a kernel fragment file using 'BR2_LINUX_KERNEL_CONFIG_FRAGMENT_FILES="\${CONFIG_DIR}/../configs/kernel_fragment.config"'.`
  },
  {
    name: 'configs/kernel_fragment.config',
    language: 'makefile',
    description: `Generate a Linux kernel configuration fragment file named 'kernel_fragment.config'. This file will be merged with tinyconfig. It must contain the following options, each set to '=y', to ensure the kernel can boot in QEMU and provide a basic console:
    - CONFIG_64BIT
    - CONFIG_DEVTMPFS
    - CONFIG_DEVTMPFS_MOUNT
    - CONFIG_BINFMT_ELF
    - CONFIG_BLK_DEV_INITRD
    - CONFIG_TTY
    - CONFIG_SERIAL_8250
    - CONFIG_SERIAL_8250_CONSOLE
    - CONFIG_PRINTK
    - CONFIG_DRM
    - CONFIG_DRM_FBDEV_EMULATION
    - CONFIG_DRM_BOCHS`
  },
  {
    name: 'scripts/build.sh',
    language: 'bash',
    description: `Generate a bash script 'scripts/build.sh'. It must be robust and path-aware, defining a PROJECT_ROOT. It must start with 'set -e'. It should perform a clean, out-of-tree Buildroot build.
    - The output directory must be '\${PROJECT_ROOT}/output'.
    - It must first run 'make' with the custom defconfig: 'make -C "\${PROJECT_ROOT}/buildroot" O="\${PROJECT_ROOT}/output" defconfig="\${PROJECT_ROOT}/configs/tiny_linux_defconfig"'.
    - Then, it must run the main build using all available processor cores: 'make -C "\${PROJECT_ROOT}/buildroot" O="\${PROJECT_ROOT}/output" -j$(nproc)'`
  },
  {
    name: 'scripts/test.sh',
    language: 'bash',
    description: `Generate a bash script 'scripts/test.sh'. It must be path-aware and start with 'set -e'. It must launch the generated kernel and initramfs using QEMU.
    - Define absolute paths for the kernel ('\${PROJECT_ROOT}/output/images/bzImage') and initramfs ('\${PROJECT_ROOT}/output/images/rootfs.cpio.gz').
    - Check if these files exist and exit with an error if they don't.
    - Execute 'qemu-system-x86_64' with the kernel and initrd, appending 'console=ttyS0' to the kernel command line, and using the '-nographic' option.`
  },
];


export const getExecuteScriptPrompt = (script: FileContent) => `
You are a sandboxed Linux shell environment. A user wants to execute the following script: '${script.name}'.
Provide a realistic, line-by-line log of what would happen if this script were executed.
Do not add any commentary, only the raw terminal output.

The script content is:
---
${script.content}
---
`;

export const getBuildScriptPrompt = (buildScript: FileContent, defconfig: FileContent, kernelFragment: FileContent) => `
You are an AI developer agent simulating a Linux build process in a sandboxed environment. You will execute a build script, encounter an error, diagnose it, fix it, and retry successfully.

Your response MUST be a stream of text containing special control tokens.
Control Tokens:
- [LOG]...[/LOG]: A block of standard terminal output.
- [ERROR]...[/ERROR]: A block of terminal output that represents a build failure.
- [ANALYSIS]...[/ANALYSIS]: Your analysis of the error as an AI agent.
- [FIX:path/to/file.ext]...[/FIX]: The complete, corrected content of the file that needs to be fixed.
- [SUCCESS]: A token indicating the final build was successful.

**The Scenario:**
The user provides a Buildroot config and a kernel fragment. The kernel fragment is missing 'CONFIG_VIRTIO_CONSOLE=y', which will cause the kernel build to fail when a certain driver is enabled. Your task is to simulate this failure.

**Your Steps:**
1.  Start the build, streaming initial logs inside [LOG]...[/LOG] tokens.
2.  Simulate a build failure related to a missing 'CONFIG_VIRTIO_CONSOLE' dependency. Stream the error messages inside [ERROR]...[/ERROR] tokens.
3.  Analyze the error. Your analysis inside [ANALYSIS]...[/ANALYSIS] should identify the missing config option.
4.  Provide the complete, corrected content of '${kernelFragment.name}' inside [FIX:${kernelFragment.name}]...[/FIX] tokens. The new content should be the original content plus 'CONFIG_VIRTIO_CONSOLE=y'.
5.  Simulate the successful second build attempt, streaming logs inside [LOG]...[/LOG] tokens.
6.  End with the [SUCCESS] token.

**Input Files:**
---
File: ${buildScript.name}
${buildScript.content}
---
File: ${defconfig.name}
${defconfig.content}
---
File: ${kernelFragment.name}
${kernelFragment.content}
---
Begin the simulation now.
`;
