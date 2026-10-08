const { Plugin, TFile, TFolder, Notice, moment, normalizePath } = require("obsidian");

module.exports = class TemplateContextMenu extends Plugin {
    onload() {
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, view) => {
                const folder = this.getTemplateFolder();
                if (!folder) return;

                menu.addItem((item) => {
                    item.setTitle("Templates").setIcon("files").setSection("insert");
                    if (typeof item.setSubmenu !== "function") {
                        // Submenus are undocumented API; fall back to the core picker if removed.
                        item.onClick(() => this.app.commands.executeCommandById("insert-template"));
                        return;
                    }
                    this.buildSubmenu(item.setSubmenu(), folder, editor, view);
                });
            })
        );
    }

    getTemplatesInstance() {
        const plugin = this.app.internalPlugins?.getPluginById?.("templates");
        return plugin && plugin.enabled ? plugin.instance : null;
    }

    getTemplateFolder() {
        const path = this.getTemplatesInstance()?.options?.folder;
        if (!path) return null;
        const folder = this.app.vault.getAbstractFileByPath(normalizePath(path));
        return folder instanceof TFolder ? folder : null;
    }

    buildSubmenu(submenu, folder, editor, view) {
        const children = [...folder.children].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true })
        );

        for (const child of children) {
            if (child instanceof TFolder) {
                submenu.addItem((item) => {
                    item.setTitle(child.name).setIcon("folder");
                    this.buildSubmenu(item.setSubmenu(), child, editor, view);
                });
            } else if (child instanceof TFile && child.extension === "md") {
                submenu.addItem((item) =>
                    item
                        .setTitle(child.basename)
                        .setIcon("file-text")
                        .onClick(() => this.insertTemplate(child, editor, view))
                );
            }
        }
    }

    async insertTemplate(file, editor, view) {
        // Prefer the core plugin's own insert so behavior matches the ribbon button exactly.
        const core = this.getTemplatesInstance();
        if (core && typeof core.insertTemplate === "function") {
            try {
                await core.insertTemplate(file);
                return;
            } catch (e) {
                console.error("Template Context Menu: core insert failed, using fallback", e);
            }
        }
        await this.fallbackInsert(file, editor, view, core?.options ?? {});
    }

    // Mirrors core Templates behavior: {{title}}/{{date}}/{{time}} substitution, frontmatter merged into the note.
    async fallbackInsert(file, editor, view, options) {
        const target = view?.file;
        let text = await this.app.vault.read(file);

        const dateFormat = options.dateFormat || "YYYY-MM-DD";
        const timeFormat = options.timeFormat || "HH:mm";
        text = text
            .replace(/{{\s*title\s*}}/gi, target ? target.basename : "")
            .replace(/{{\s*date\s*(?::([^}]+))?}}/gi, (_, fmt) => moment().format(fmt?.trim() || dateFormat))
            .replace(/{{\s*time\s*(?::([^}]+))?}}/gi, (_, fmt) => moment().format(fmt?.trim() || timeFormat));

        let body = text;
        let templateProps = null;
        const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
        if (fm) {
            body = text.slice(fm[0].length);
            try {
                templateProps = require("obsidian").parseYaml(fm[1]) || null;
            } catch (e) {
                new Notice("Template frontmatter could not be parsed; inserted body only.");
            }
        }

        editor.replaceSelection(body);

        if (target && templateProps && typeof templateProps === "object") {
            await this.app.fileManager.processFrontMatter(target, (front) => {
                for (const [key, value] of Object.entries(templateProps)) {
                    if (!(key in front)) {
                        front[key] = value;
                    } else if (Array.isArray(front[key]) && Array.isArray(value)) {
                        front[key] = [...new Set([...front[key], ...value])];
                    }
                }
            });
        }
    }
};
