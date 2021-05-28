<template>
  <div>
    <v-menu v-model="innerShow" :position-x="position.x + (menuMode === 'CANVAS'? 0 :  +10)" :position-y="position.y+(menuMode === 'CANVAS'? -30 :  -10)" z-index="999" absolute offset-y transition="scale-transition" class="contextmenu body-2">
      <context-menu-list :items="menu" :deep="0" :width="menuWidth" @menu="action"></context-menu-list>
    </v-menu>
    <new-subtree-dialog :existingSubtrees="subtreeNames" :dialog="showNewSubtreeDialog" @close="showNewSubtreeDialog = false" @create="$emit('createSubtree', $event)"></new-subtree-dialog>
  </div>
</template>
<script>

import ContextMenuList from './ContextMenuList';
import TreeElement from '@/entities/TreeElement';
import { TREE_TYPE } from '@/enumerates/TreeType';
import { ELEMENT_TYPE } from '@/enumerates/ElementType';
import NewSubtreeDialog from '@/components/dialogs/NewSubtreeDialog';
// eslint-disable-next-line @typescript-eslint/no-this-alias
const self = this;
export default {
  name: 'ContextMenu',
  components: { NewSubtreeDialog, ContextMenuList },
  props: {
    show: Boolean,
    menuMode: String,
    editor: Object,
    selectedTreeElement: TreeElement,
    projectControllerRef: Object,
    position: { type: Object,
                default: () => {return {x: 0, y: 0}}
    },
  },
  data: () => ({
    menu: [],
    innerShow: false,
    menuWidth: 300,
    showNewSubtreeDialog: false,
    subtreeNames: [],
  }),
  methods: {
    close(){
      this.innerShow = false;
    },
    action(e){
      switch (e){
        case 'COPY':
          this.editor.copy();
          break;
        case 'PASTE':
          this.editor.paste();
          break;
        case 'CUT':
          this.editor.cut();
          break;
        case 'EDIT_PROPERTIES':
          if(this.editor.getSelectedElements().length !==1){
            return;
          }
          this.$emit('editProperties', this.editor.getSelectedElements()[0]);
          break;
        case 'OPEN_ELEMENT':
          if(this.editor.getSelectedElements().length !==1){
            return;
          }
          this.$emit('openElement', this.editor.getSelectedElements()[0]);
          break;
        case 'OPEN_FILE':
          this.$emit('openFile', this.selectedTreeElement);
          break;
        case 'NEW_SUBTREE':
          this.openSubtreeDialog();
          break;
        case 'RELOAD_PROJECT':
          location.reload();
          break;
      }
      this.innerShow = false;
    },
    openSubtreeDialog(){
      this.subtreeNames = this.projectControllerRef.getSubtreeNames();
      this.showNewSubtreeDialog = true;
    },
    updateContextMenu(){
      const canvasMenu = [
        {
          name: 'Open',
          innerAction: 'OPEN_ELEMENT',
          disabled: false,
        },
        {
          name: 'Edit Properties',
          innerAction: 'EDIT_PROPERTIES',
          icon: 'mdi-pencil',
          disabled: false
        },
        {name: 'DIVIDER'},
        {
          name: 'New Subtree',
          innerAction: 'NEW_SUBTREE',
          disabled: false,
        },
        {name: 'DIVIDER'},
        {
          name: 'Paste',
          accelerator: 'Ctrl+V',
          disabled: false,
          innerAction: 'PASTE'
        },
        {
          name: 'Cut',
          disabled: false,
          innerAction: 'CUT',
          accelerator: 'Ctrl+X',
        },
        {
          name: 'Copy',
          disabled: false,
          innerAction: 'COPY',
          accelerator: 'Ctrl+C',
        },
        {name: 'DIVIDER'},
        {
          name: 'Reload From Disk',
          innerAction: 'RELOAD_PROJECT',
          icon: 'mdi-reload'
        }
      ]

      const treeViewMenu= [
        {
          name: 'Open',
          innerAction: 'OPEN_FILE'
        },
        {
          name: 'New Subtree',
          innerAction: 'NEW_SUBTREE'
        },
        // {
        //   name: 'DIVIDER',
        // },
        // {
        //   name: 'Rename',
        //   innerAction: 'RENAME_SUBTREE',
        // },
        // {
        //   name: 'Delete',
        //   innerAction: 'DELETE_SUBTREE',
        //   icon: 'mdi-delete'
        // },
        {name: 'DIVIDER'},
        {
          name: 'Reload From Disk',
          innerAction: 'RELOAD_PROJECT',
          icon: 'mdi-reload'
        }
      ];
      if(this.show){
        switch (this.menuMode){
          case 'CANVAS':
            this.menu = canvasMenu;
            this.menu[0].disabled = this.editor.getSelectedElements().length !==1 || this.editor.getSelectedElements()[0].hasName('ENTRY');
            this.menu[1].disabled = this.editor.getSelectedElements().length !==1 || this.editor.getSelectedElements()[0].hasName('ENTRY');
            this.menu[3].disabled = this.editor.getSelectedElements().length <= 1 && this.editor.getSelectedElements().filter(o => o.hasName('ENTRY').length === 0);
            this.menu[5].disabled = !this.editor.canPaste();
            this.menu[6].disabled = !this.editor.canCut();
            this.menu[7].disabled = !this.editor.canCopy();
            break;
          case 'TREEVIEW':
            // eslint-disable-next-line no-case-declarations
            const isSubtree = this.selectedTreeElement.type === TREE_TYPE.ELEMENT && this.selectedTreeElement.object.type === ELEMENT_TYPE.SUBTREE;
            this.menu = treeViewMenu;
            this.menu[1].disabled = this.selectedTreeElement.type !== TREE_TYPE.FILE && !(isSubtree);
            // this.menu[3].disabled = !isSubtree;
            // this.menu[4].disabled = !isSubtree;
            break;
        }
        this.innerShow = true;
      }else{
        this.innerShow = false;
      }
    }
  },
  watch: {
    innerShow: {
      handler(){
        if(!this.innerShow){
          this.$emit('close');
        }
      },
      deep: true
    },
    position: {
      handler(){
        this.updateContextMenu();
      },
      deep: true
    },
    show: {
      handler(){
        this.updateContextMenu();
      },
      deep:true
    }
  },
};
</script>


<style >


</style>