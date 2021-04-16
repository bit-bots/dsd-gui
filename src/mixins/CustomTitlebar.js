
import CacheController from '@/controller/CacheController';
import { Color } from 'custom-electron-titlebar';
import File from '@/entities/File';
const customTitlebar = require('custom-electron-titlebar');
const remote = require('electron').remote;

export default {
    data: () => ({
        titlebar: undefined,
    }),
    computed: {
        theme(){
            return this.$store.state.theme;
        }
    },
    watch: {
      theme: {
          handler(){
              this.updateColor()
          },
          deep: true,
      }
    },
    methods:{
        initializeTitleBar(){
            window.addEventListener('DOMContentLoaded', () => {
                this.titlebar = new customTitlebar.Titlebar({
                                                                backgroundColor: customTitlebar.Color.fromHex(this.$vuetify.theme.currentTheme.primary.toString()),
                                                                icon: require('@/assets/logo.png'),
                                                            });
                this.titlebar.setHorizontalAlignment('center');
                this.initializeTitleMenu();
                this.updateColor();

                const replaceText = (selector, text) => {
                    const element = document.getElementById(selector)
                    if (element) element.innerText = text
                }

                for (const type of ['chrome', 'node', 'electron']) {
                    replaceText(`${type}-version`, process.versions[type])
                }
            })
        },
        updateTitleBar(title){
            if(this.titlebar){
                this.titlebar.updateTitle(title);

            }
        },
        updateColor(){
            if(this.titlebar){
                this.titlebar.updateBackground(Color.fromHex(this.$store.state.theme.darkMode ? this.$vuetify.theme.themes.dark.primary : this.$vuetify.theme.themes.light.primary));
            }
        },
        initializeTitleMenu(){
            const recentProjectIds = CacheController.getRecentProjectIds();
            const displayProjects = [];
            for(let i =0; i <recentProjectIds.length; i++){
                const recentProject = CacheController.getLocalProjectConfiguration(recentProjectIds[i])
                displayProjects.push({label: File.getFileName(recentProject.path)});
            }
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            const isMac = process.platform === 'darwin'
            const fileTemplate =[
                {
                    label: 'Open Project',
                    click: () => self.$eventHub.$emit('OPEN_PROJECT')
                },
                {
                    label: 'Recent Projects',
                    submenu: [
                            ...displayProjects,
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Other',
                            click: () => self.$eventHub.$emit('OPEN_PROJECT')
                        },
                    ]
                },
                {
                    label: 'Close Project',
                    click: () => self.$eventHub.$emit('CLOSE_PROJECT')
                },
                { type: 'separator' },
                {
                    label: 'Save All',
                    accelerator: 'Crtl + S',
                    click: () => {
                        self.$eventHub.$emit('SAVE_ALL')
                    }
                },
                {
                    label: 'Reload From Disk',
                    click: () => {
                        location.reload();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    click: () => self.$eventHub.$emit('OPEN_SETTINGS')
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' },
            ];
            const editTemplate = [
                {
                    label: 'Redo',
                    accelerator: 'Crtl + Shift + Z',
                    click: () => self.$eventHub.$emit('REDO')
                },
                {
                    label: 'Undo',
                    accelerator: 'Crtl + Z',
                    click: () => self.$eventHub.$emit('UNDO')
                },
                { type: 'separator' },
                {
                    label: 'Cut',
                    accelerator: 'Crtl + X',
                    click: () => self.$eventHub.$emit('CUT')
                },
                {
                    label: 'Copy',
                    accelerator: 'Crtl + C',
                    click: () => self.$eventHub.$emit('COPY')
                },
                {
                    label: 'Paste',
                    accelerator: 'Crtl + V',
                    click: () => self.$eventHub.$emit('PASTE')
                },
                { type: 'separator' },
                {
                    label: 'Delete',
                    accelerator: 'Entf',
                    click: () => self.$eventHub.$emit('DELETE')
                },
                { type: 'separator' },
                {
                    label: 'Search Element',
                    accelerator: 'Crtl + F',
                    click: () => self.$eventHub.$emit('SEARCH_ELEMENT')
                },
            ]
            const ViewTemplate = [
                {
                    label: 'Zoom In',
                    accelerator: 'mouse wheel up',
                    click: () => self.$eventHub.$emit('ZOOM_IN')
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'mouse wheel down',
                    click: () => self.$eventHub.$emit('ZOOM_OUT')
                },
                {
                    label: 'Toggle Drag',
                    accelerator: 'mouse wheel pressed',
                    click: () => self.$eventHub.$emit('TOGGLE_DRAG')
                },
                { type: 'separator' },
                {
                    label: 'Restructure',
                    accelerator: 'Crtl + D',
                    click: () => self.$eventHub.$emit('RESTRUCTURE')
                },
                {
                    label: 'Reload from DSD-File',
                    click: () => self.$eventHub.$emit('RELOAD_FROM_FILE')
                },
            ]
            const template = [
                {
                    label: 'File',
                    submenu: fileTemplate
                },
                {
                    label: 'Edit',
                    submenu: editTemplate,
                },
                {
                    label: 'View',
                    submenu: ViewTemplate
                }
            ];
            const menu = remote.Menu.buildFromTemplate(template);
            this.titlebar.updateMenu(menu);
        },
    },
}