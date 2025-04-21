/**
 * Utilities for traversing Framer node hierarchies
 */

/**
 * Traverses the node hierarchy to find all descendant nodes
 * @param node Parent node
 * @returns Promise<any[]> All descendant nodes
 */
export async function getAllDescendants(node: any): Promise<any[]> {
    const descendants: any[] = [];
    
    try {
      // Get immediate children
      const children = await node.getChildren();
      
      if (!children || children.length === 0) {
        return descendants;
      }
      
      // Add children to descendants
      descendants.push(...children);
      
      // Recursively get descendants of each child
      for (const child of children) {
        const childDescendants = await getAllDescendants(child);
        descendants.push(...childDescendants);
      }
    } catch (error) {
      console.error("Error getting descendants for node:", node.id, error);
    }
    
    return descendants;
  }
  
  /**
   * Finds all ancestors of a node up to the root
   * @param node The node to find ancestors for
   * @returns Promise<any[]> Array of ancestor nodes
   */
  export async function getAncestors(node: any): Promise<any[]> {
    const ancestors: any[] = [];
    
    try {
      let currentNode = node;
      
      // Traverse up the hierarchy
      while (currentNode) {
        const parent = await currentNode.getParent();
        
        if (!parent) {
          break;
        }
        
        ancestors.push(parent);
        currentNode = parent;
      }
    } catch (error) {
      console.error("Error getting ancestors for node:", node.id, error);
    }
    
    return ancestors;
  }
  
  /**
   * Gets the path from the root to a node (node names joined by '/')
   * @param node The node to get the path for
   * @returns Promise<string> Path string
   */
  export async function getNodePath(node: any): Promise<string> {
    try {
      const ancestors = await getAncestors(node);
      
      // Reverse ancestors to get root-to-node order
      ancestors.reverse();
      
      // Create path with node names
      const pathParts = ancestors.map(ancestor => ancestor.name || ancestor.id);
      pathParts.push(node.name || node.id);
      
      return pathParts.join('/');
    } catch (error) {
      console.error("Error getting path for node:", node.id, error);
      return node.id;
    }
  }
  
  /**
   * Checks if a node is visible (not hidden and all ancestors are visible)
   * @param node The node to check
   * @returns Promise<boolean> True if the node is visible
   */
  export async function isNodeVisible(node: any): Promise<boolean> {
    try {
      // Check if the node itself is hidden
      if (node.visible === false) {
        return false;
      }
      
      // Check if any ancestors are hidden
      const ancestors = await getAncestors(node);
      
      for (const ancestor of ancestors) {
        if (ancestor.visible === false) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error checking visibility for node:", node.id, error);
      return true; // Default to visible
    }
  }
  
  /**
   * Finds nodes by name pattern in the hierarchy
   * @param rootNode The root node to start searching from
   * @param namePattern Regex pattern to match node names
   * @returns Promise<any[]> Matching nodes
   */
  export async function findNodesByName(rootNode: any, namePattern: RegExp): Promise<any[]> {
    const matchingNodes: any[] = [];
    
    try {
      // Check if root node matches
      if (rootNode.name && namePattern.test(rootNode.name)) {
        matchingNodes.push(rootNode);
      }
      
      // Check all descendants
      const descendants = await getAllDescendants(rootNode);
      
      for (const descendant of descendants) {
        if (descendant.name && namePattern.test(descendant.name)) {
          matchingNodes.push(descendant);
        }
      }
    } catch (error) {
      console.error("Error finding nodes by name:", error);
    }
    
    return matchingNodes;
  }
  
  /**
   * Gets the Z-index order of nodes based on their position in the hierarchy
   * @param nodes Array of nodes to sort
   * @returns Promise<any[]> Nodes sorted by Z-index (front to back)
   */
  export async function getNodesInZOrder(nodes: any[]): Promise<any[]> {
    try {
      // Make a copy of the nodes array to avoid modifying the original
      const nodesCopy = [...nodes];
      
      // Get all parent nodes
      const parentIdToChildren = new Map<string, any[]>();
      
      for (const node of nodesCopy) {
        const parent = await node.getParent();
        
        if (parent) {
          if (!parentIdToChildren.has(parent.id)) {
            parentIdToChildren.set(parent.id, []);
          }
          
          parentIdToChildren.get(parent.id)?.push(node);
        }
      }
      
      // Sort nodes within each parent
      for (const [parentId, children] of parentIdToChildren.entries()) {
        // Sort by index within parent (higher index = front)
        children.sort((a, b) => {
          const aIndex = nodesCopy.findIndex(n => n.id === a.id);
          const bIndex = nodesCopy.findIndex(n => n.id === b.id);
          return bIndex - aIndex;
        });
      }
      
      // Build the final sorted array
      const result: any[] = [];
      const processed = new Set<string>();
      
      // Helper function to add a node and its children in Z order
      const addNodeAndChildren = (node: any) => {
        if (processed.has(node.id)) {
          return;
        }
        
        processed.add(node.id);
        result.push(node);
        
        const children = parentIdToChildren.get(node.id) || [];
        for (const child of children) {
          addNodeAndChildren(child);
        }
      };
      
      // Process all nodes
      for (const node of nodesCopy) {
        addNodeAndChildren(node);
      }
      
      return result;
    } catch (error) {
      console.error("Error sorting nodes by Z-index:", error);
      return nodes; // Return unsorted as fallback
    }
  }