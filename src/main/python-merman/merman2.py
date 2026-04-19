import re
import copy
import sys

sys.setrecursionlimit(20000)

# import json

# Classes ------ -------------

# applied to each line in the file: ------


class MermanLine:
    global re
    global copy
    # meta functions ----

    def __init__(self, text, line_number):
        self.text = text
        self.line_number = line_number
        # self.type = 'plainline'

    def __repr__(self):
        return 'line ' + str(self.line_number) + '::: ' + self.text

        # Accessors ----

    def get_text(self):
        return self.text

        # ID with _<number> are reserved
    def generate_id(self):
        return "_" + str(self.line_number)

        # returns linenumber as int
    def get_linenumber(self):
        return self.line_number

        # sorting functions ----
        # determine which type of line this is; comment, node, styledef etc.

    def is_blank(self):  # true of false
        return True if re.search(r'^[^\S\n\t]*$', self.text) else False

    def is_block_comment_marker(self):
        return True if re.search(r'^\s*###\s*$', self.text) else False

    def is_comment(self):
        return True if re.search(r'^\s*#.*', self.text) else False

    def is_style(self):
        return True if re.search(r'^\s*\$.*$', self.text) else False

    def is_section(self):
        return True if re.search(r'^\s*===[=]*\s*$', self.text) else False

    def is_patchbay(self):
        return True if re.search(r'^\s*\@.*$', self.text) else False

    def is_subgraph(self):
        return True if re.search(r'^\s*~~~.*$', self.text) else False

        # --- Split  -or- Separate
    def is_split(self):
        if re.search(r'^\s*%(split|separate|seperate)', self.text):
            return True
        return False

    def is_branch(self):
        if re.search(r'^\s*%(branch)', self.text):
            return True
        return False

        # --- Join  -or- Done
    def is_join(self):
        if re.search(r'^\s*%(join|done)', self.text):
            return True
        return False

    # TODO update merman syntax for pointers with multiple ^^^^ &&&& or *** symbols on both ends

    def is_pointer(self):
        markers_found = re.search(
            r'^\s*-\s*([\^\&]*)[A-Za-z0-9_+-]+([\^\&]*)', self.text)

        # if no match is found
        if not markers_found:
            return False

            # if markers were matched, i.e not an empty string
        if markers_found[1] or markers_found[2]:
            return True
        return False  # otherwise

    def is_reference(self):
        markers = re.search(r'^\s*-\s*(\**)[A-Za-z0-9_+-]+(\**)', self.text)
        # if * is at the start and/or end of an ID string
        if markers and (markers[1] or markers[2]):
            return True

        # print a message saying that line: line_number has and a syntax error
    def throw_error(self, message=None):
        print("\n\n  === ERROR ===  \n")
        if message:
            print(message)
        print("\nLine:", self.line_number, " -> ",  self.text.strip())
        raise Exception  # TODO: include line number here for processing


class Comment:
    # autoremoves '#' at start of line ?
    def __init__(self, single_line_comment=None):
        self.lines = []

        if single_line_comment:
           # remove '#' and preceeding WhiteSpace at start
            self.lines.append(single_line_comment)

        # self.type = 'comment'

         # append another line to an existing comment
         # for e.g. block comments
    def combine(self, another_line):
        self.lines.append(another_line)

    # returns the line(s) stored in this comment object as text
    def get_text(self):
        return "\n".join([x.get_text() for x in self.lines])

    # returns the line(s) stored in this comment object as text "cleaned up"
    def get_rich_text(self):
        if len(self.lines) == 1:  # single line comment
            return self.lines[0].get_text().replace('#', '', 1)
        else:  # multiline comment
            return "<br>".join([x.get_text() for x in self.lines])

    # returns linenumber as int
    def get_linenumber(self):
        return self.lines[0].get_linenumber()

    def __repr__(self):
        if len(self.lines) > 0:
            return '__COMMENT__' + " -|- ".join([str(x) for x in self.lines])
        else:
            return 'No comments'


# -----------------------------  ABC CLASS MermaidLine
class MermaidLine():
    global Pointer
    global Reference
    global DescendantLink

    line = None
    child = None
    remainder = ''  # after extract_any_text

    # get and store MermaidLine object
    def __init__(self, ScriptLine):
        self.line = ScriptLine

    def set_child(self, Node):
        self.child = Node

    def throw_error(self, msg=None):
        self.line.throw_error(msg)

        # ID of next node in the chain, as a DescendantLink object
        # summary: True if creating summary graph, False if generating script
    def get_descendant_link(self, summary=False):
        pass

    def get_mermaid_text(self, summary=False):
        pass

    def get_mermaid_link(self, summary=False):
        pass

        # Utility Functions
        # extracts the sub-string between the first instance
        # of the marker and the last instance of the marker from source
        # or returns None
        # also records the remaining text
    def extract_any_text(self, source, marker):
        start, end = source.find(marker), source.rfind(marker)

        # if no match, or less then two markers in source
        if start == end:
           # Nothing extracted
            self.remainder = source
            return None
        else:
           # string that remains after extraction
            self.remainder = source[:start] + source[end+1:]
            return source[start+1:end]

    # ----------------------------- DescendantLink


class DescendantLink:

    def __init__(self, ID, linktext=None):
        self.links = [{  # all the links associated with this class
            'ID': ID,
            'linktext': linktext
        }]

        # generates "ParentID==>|optional text|ChildID" mermaid link text

    def generate_mermaid_link_from(self, parentID):
        result = ""

        for child in self.links:
            if child['ID']:  # ID's could be none?
                result += parentID + "==>"  # parent + arrow
                # add link text if applicable
                if child['linktext']:
                    result += '|"' +  \
                        child['linktext'].replace('"', '&quot;') + '"|'
                 # child id, end of statement
                result += child['ID'] + ';'

        return result

        # combine two DescendantLink Objects together

    def merge_with(self, otherDescendantLink):
        if otherDescendantLink:  # otherLink could be None
            self.links += otherDescendantLink.links

    # appends text to the beginning of linktext for all links
         # differentiates between different lines of appended text using html

    def append(self, text):
        for link in self.links:
           # sort out none condition
            if not link.get('linktext', None):
                link['linktext'] = ""

           # by default, when line is initially stored, it is not bold.
            if link.get('bold', True):  # if this line should be bold
                link['bold'] = False  # next line is not bold
                link['linktext'] = '<b>'+text+'</b><br>' + link['linktext']
            else:
                link['bold'] = True  # next line will be bold
                link['linktext'] = text + '<br>' + link['linktext']

    def __repr__(self):
        return "--_DescendantLink_--\n\t" + "\n\t".join(
            ["ID: " + str(x['ID']) + '\tLinkText: ' + str(x['linktext'])
             for x in self.links])

    # -----------------------------  Style


class Style(MermaidLine):

    # pass through to next link in chain
    # summary: True if creating summary graph, False if generating script
    def get_descendant_link(self, summary=False):
        if self.child:
            return self.child.get_descendant_link(summary)
        return None

    def get_mermaid_text(self, summary=False):
        # remove $ from start
        return "classDef " + self.line.get_text().replace('$', '', 1).strip()

        # No link
    def get_mermaid_link(self, summary=False):
        return "%% ClassDef / Style"

    def __repr__(self):
        return "__Style__" + str(self.line)

    # -----------------------------  Section


class Section(MermaidLine):

    # Hard separation - breaks chain
    # summary: True if creating summary graph, False if generating script
    def get_descendant_link(self, summary=False):
        return None

        # No text
    def get_mermaid_text(self, summary=False):
        return "%% SECTION"

        # No link
    def get_mermaid_link(self, summary=False):
        return "%% SECTION"

    def __repr__(self):
        return "----------Section--------" + str(self.line)

    # -----------------------------  Patchbay


class Patchbay(MermaidLine):

    # Hard separation - breaks chain
    # summary: True if creating summary graph, False if generating script
    def get_descendant_link(self, summary=False):
        return None

        # directly passes through all text after @
    def get_mermaid_text(self, summary=False):
        return self.line.get_text().replace('@', '', 1)

        # No link
    def get_mermaid_link(self, summary=False):
        return "%% Patchbay"

    def __repr__(self):
        return "__Patchbay__" + str(self.line)

    # -----------------------------  Subgraph


class Subgraph(MermaidLine):
    parent = None

    # pass through to next link in chain
    # summary: True if creating summary graph, False if generating script
    def get_descendant_link(self, summary=False):
        if self.child:
            return self.child.get_descendant_link(summary)
        return None

    # true if line is start marker
    def is_start(self):
        title = self.line.get_text().replace('~~~', '', 1).strip()
        return re.search(r'[^\s]', title)

    # register corresponding starting subgraph line
    def register_start(self, subgraph_line):
        self.parent = subgraph_line

    # return the classdef/style of the Subgraph, if it exists
    def get_class(self):
        match = re.findall(r'~~~[A-Za-z0-9_]+', self.line.get_text())

        if len(match) != 0:
            return match[0].replace('~~~', "")
        else:
            return None

    # get the unique ID assigned to this line

    def get_ID(self):
        return self.line.generate_id()

        # could be either a start or end marker
    def get_mermaid_text(self, summary=False):
        if self.is_start():  # if starting tag
            # get title: (has to have a space after ~~~)
            title = re.sub(r'~~~[A-Za-z0-9_]*', "",
                           self.line.get_text(), count=1).strip()

            if len(title) == 0:
                self.throw_error("Title not found for this line!")

            title.replace('"', '&quot;')  # sanitize title
            return "subgraph " + self.get_ID() + '["' + title + '"]'

        else:  # else closing tag
            return "end"
#      also_include = "" # also print this
#
#      if self.parent.get_class():
#          # assign the classdef for the subgraph
#        also_include = "\n" + self.parent.get_ID() + ":::" + self.parent.get_class()
#
#      return "end" + also_include

         # No link
    def get_mermaid_link(self, summary=False):
        if self.get_class():
            return self.get_ID() + ":::" + self.get_class()
        else:
            return "%% Subgraph"

    def __repr__(self):
        return "__Subgraph__" + str(self.line)

    # -------------------------  Common Code for Pointers and References


class Link(MermaidLine):

    def __init__(self, ScriptLine):
        self.ref_ID = None
        self.link_text = None

        if ScriptLine:  # if not None
            self.line = ScriptLine
           # set the ID this pointer connects to from the line's text:
            self._set_refID_from(self.line.get_text())
            self._validate_ID()
           # extract any link text that might exist
            self.link_text = self.extract_any_text(self.line.get_text(), '"')

         # set Reference ID from plain text, instead of a ScriptLine object

    def manually_register(self, rawtext, link_text=None):
        self._set_refID_from(rawtext)
        self._validate_ID()
        self.link_text = link_text

        # set ID from string that contains a reference or pointer definition in it

    def _set_refID_from(self, rawtext):
        pass

        # manually override/set the ref_ID to ID (plain text)

    def set_reference_ID(self, ID):
        self.ref_ID = ID
        self._validate_ID()

        # checks to see if ID is only either Alphanumerical, + or -; not some combination

    def _validate_ID(self):
        if not self.ref_ID:
            self.throw_error("Why am I expecting an ID here?")

        if re.search(r'[A-Za-z0-9_]', self.ref_ID) and \
                re.search(r'[+-]', self.ref_ID):
            self.throw_error(
                "Is this supposed to be an ID/Tag or a QuickConnect?")
        if self.ref_ID.find("+") > -1 and self.ref_ID.find("-") > -1:
            self.throw_error(
                "Unsure what kind of QuickConnect this is supposed to be. Both '-' and '+' found")

         # connects to previous quickconnect point

    def is_quickconnect_previous(self):
        return self.ref_ID and self.ref_ID.find('-') > -1

        # connects to next quickconnect point

    def is_quickconnect_next(self):
        return self.ref_ID and self.ref_ID.find('+') > -1

    # -- unnecessary MermaidLine functions: --

        # this shouldn't be triggered
        # summary: True if creating summary graph, False if generating script
    def get_descendant_link(self, summary=False):
        self.throw_error("This Pointer/Reference doesn't belong to a node")

        # this shouldn't be triggered
    def get_mermaid_text(self, summary=False):
        self.throw_error("This Pointer/Reference doesn't belong to a node")

        # this shouldn't be triggered
    def get_mermaid_link(self, summary=False):
        self.throw_error("This Pointer/Reference doesn't belong to a node")

    # -----------------------------  Pointer
    # NOTE: ref_ID can be NONE


class Pointer(Link):
    terminating = False  # immutable

    # set ID from string that contains a pointer definition in it
    def _set_refID_from(self, rawtext):
        # match
        matches = re.findall(r'[\^\&][A-Za-z0-9_+-]+', rawtext) + \
            re.findall(r'[A-Za-z0-9_+-]+[\^\&]', rawtext)

        if not matches:
            return

        if len(matches) > 1:
            self.throw_error(
                "Pointer not defined Properly, and/or Multiple Pointers found?")

         # the Mermaid NodeID that this pointer connects to
        self.ref_ID = matches[0].replace('^', '').replace('&', '')

        # TODO if self.ref_ID has both [A-za-z0-9_] and [+-], throw error

        # if '^', then this is a terminating pointer
        if matches[0].find('^') > -1:
            self.terminating = True

         # package ID and link_text into a DescendantLink object

    def convert_to_descendant_link(self):
        # NOTE: ref_ID can be NONE
        if self.ref_ID:
            return DescendantLink(self.ref_ID, self.link_text)
        return None

    def __repr__(self):
        return "__Pointer__" + str(self.line) + \
            "\n\tReferenceID: " + str(self.ref_ID) + \
            "\n\tLink Text: " + str(self.link_text) + \
            "\n\tQuickConnect:" + \
            "\n\t\tPrevious - " + str(self.is_quickconnect_previous()) + \
            "\n\t\tNext - " + str(self.is_quickconnect_next())

    # -----------------------------  Reference
    # NOTE: ref_ID can be NONE


class Reference(Link):

    # set ID from string that contains a reference definition in it
    def _set_refID_from(self, rawtext):
        # match
        matches = re.findall(r'\*[A-Za-z0-9_+-]+', rawtext) + \
            re.findall(r'[A-Za-z0-9_+-]+\*', rawtext)

        if not matches:
            return

        if len(matches) > 1:
            self.throw_error(
                "Reference not defined Properly, and/or Multiple References found?")

         # the Mermaid NodeID that this pointer connects to
        self.ref_ID = matches[0].replace('*', '')

        # generate mermaid link from reference to DescendantLink ID

    def generate_mermaid_link_to(self, descendant):

        if self.link_text:  # register reference link text
            # Nodes with multiple References with link_text cause an error, where the link_text for the first reference assigned to a node is appended to the link_text for the second reference, etc.
            descendant = copy.deepcopy(descendant)
            descendant.append(self.link_text)

         # generate the link text
        return descendant.generate_mermaid_link_from(self.ref_ID)

    # NOTE: ref_ID can be NONE

    def __repr__(self):
        return "__Reference__" + str(self.line) + \
            "\n\tReferenceID: " + str(self.ref_ID) + \
            "\n\tLink Text: " + str(self.link_text) + \
            "\n\tQuickConnect:" + \
            "\n\t\tPrevious - " + str(self.is_quickconnect_previous()) + \
            "\n\t\tNext - " + str(self.is_quickconnect_next())

    # -----------------------------  Split


class Split(MermaidLine):

    def __init__(self, ScriptLine):
        self.branches = []
        super().__init__(ScriptLine)

    def register_branch(self, node):
        self.branches.append(node)

        # sends a separate get_descendant_id request to all it's registered branches and Consolidates the responses
        # summary: True if creating summary graph, False if generating script

    def get_descendant_link(self, summary=False):
        response = DescendantLink(None)  # initalize empty link

        for branch in self.branches:
            response.merge_with(branch.get_descendant_link(summary))

        return response

        # No text

    def get_mermaid_text(self, summary=False):
        return "%% Split"

        # No link
    def get_mermaid_link(self, summary=False):
        return "%% Split"

    def __repr__(self):
        return "__Split__" + self.line.get_text() + \
            "\n\tRegistered Branches: " + str(self.branches)

    # -----------------------------  Branch


class Branch(MermaidLine):

    def __init__(self, ScriptLine):
        self.line = ScriptLine
        self.link_text = self.extract_any_text(self.line.get_text(), '"')

        # passes through descendant requests, but appends its own link text to the result
        # summary: True if creating summary graph, False if generating script
    def get_descendant_link(self, summary=False):
        if self.child:
            response = self.child.get_descendant_link(summary)

            if self.link_text:
                response.append(self.link_text)

            return response
        return None

        # No text

    def get_mermaid_text(self, summary=False):
        return "%% Branch"

        # No link
    def get_mermaid_link(self, summary=False):
        return "%% Branch"

    def __repr__(self):
        return "__Branch__" + self.line.get_text() + \
            "\n\tLink Text: " + str(self.link_text)

    # ------------------- Common Code for Nodes that can have References or Pointers associated with them.


class Linkable(MermaidLine):
    # NOTE: SubClasses must have self.pointers = []
    # NOTE: SubClasses must have self.references = []

    # adds a Reference or Pointer object to self
    def register_reference_or_pointer(self, link):
        if isinstance(link, Reference):
            self.references.append(link)
        elif isinstance(link, Pointer):
            self.pointers.append(link)
        else:
            link.throw_error("Why am I Expecting a Reference or Pointer?")

    # Utility: Standard Regex for pointers, returns multiple results

    def find_all_pointers(self, search_string):
        matches = re.findall(r'[\^\&][A-Za-z0-9_+-]+', search_string) + \
            re.findall(r'[A-Za-z0-9_+-]+[\^\&]', search_string)
        if not matches:
            return []
        return matches

    # Utility: Standard Regex for references, returns multiple results

    def find_all_references(self, search_string):
        matches = re.findall(r'\*[A-Za-z0-9_+-]+', search_string) + \
            re.findall(r'[A-Za-z0-9_+-]+\*', search_string)
        if not matches:
            return []
        return matches

        # true if any of the pointers are terminating pointers

    def terminating(self):
        for pointer in self.pointers:
            if pointer.terminating:
                return True
        return False

        # true if this node somehow connects to previous quickconnect point

    def is_quickconnect_previous(self):
        for link in self.references + self.pointers:
            if link.is_quickconnect_previous():
                return True
        return False

        # true if this node somehow connects to the next quickconnect point

    def is_quickconnect_next(self):
        for link in self.references + self.pointers:
            if link.is_quickconnect_next():
                return True
        return False

        # set quickconnect - previous links to quickconnect point_ID

    def set_quickconnect_previous_id(self, point_ID):
        for link in self.references + self.pointers:
            if link.is_quickconnect_previous():
                link.set_reference_ID(point_ID)  # manually set ref_ID for link

         # set quickconnect - next links to quickconnect point_ID

    def set_quickconnect_next_id(self, point_ID):
        for link in self.references + self.pointers:
            if link.is_quickconnect_next():
                link.set_reference_ID(point_ID)  # manually set ref_ID for link

    # -----------------------------  Join


class Join(Linkable):

    def __init__(self, ScriptLine):
        self.line = ScriptLine
        self.pointers = []
        self.references = []

        linetext = self.line.get_text()

        # Register Pointers ---
        for result in self.find_all_pointers(linetext):
            self.pointers.append(Pointer(None))  # initalize empty pointer
            self.pointers[-1].manually_register(result)  # set pointer to ID

         # Register References ---
        for result in self.find_all_references(linetext):
            # initalize empty reference
            self.references.append(Reference(None))
            self.references[-1].manually_register(result)  # set to ID

         # directs all get_descendant_id requests straight to child
        # summary: True if creating summary graph, False if generating script

    def get_descendant_link(self, summary=False):
        response = None

        if self.child and not self.terminating():  # get next node in chain
            response = self.child.get_descendant_link(summary)

        if not response:  # sections and patchbays return None
            response = DescendantLink(None)

        if self.pointers:  # also include pointers
            for pointer in self.pointers:
                response.merge_with(pointer.convert_to_descendant_link())

        return response

        # Connect any references to next node in chain

    def get_mermaid_text(self, summary=False):
        response = ""

        # avoid self.pointers
        if self.child and not self.terminating():
            joinpoint = self.child.get_descendant_link(
                summary)  # next node in link
            for reference in self.references:
                response += reference.generate_mermaid_link_to(joinpoint) + ';'

        if response == ';':
            response = ''

        return response + '\n%% Join'

        # No link

    def get_mermaid_link(self, summary=False):
        return "%% Join"

    def __repr__(self):
        return "__Join__" + self.line.get_text() + \
            "\n\tPointers:\n" + str(self.pointers) + \
            "\n\tReferences:\n" + str(self.references)


class GraphNode(Linkable):

    # NOTE IMPLEMENT titles? |hello| or special char: \|

    def __init__(self, ScriptLine):
        # NOTE do not throw error here if no text is found.

        # all variables ======
        self.script = None
        self.summary = None
        self.title = None
        self.classdef = None
        self.quickconnect = False
        self.mandatory = False  # for nodes that have proper IDs
        self.ID = None
        self.multiline = False
        self.node_size = None
        self.node_word_wrap = 25  # default value for word wrapping
        self.node_type = ''  # bracket type
        self.node_type_variant = 0  # how many brackets
        self.pointers = []
        self.references = []

        self.line = ScriptLine
        # extract written content
        self.script = self.extract_any_text(self.line.get_text(), '"')
        # self.remainder is all the text left after the previous extract_any_text command
        self.summary = self.extract_any_text(self.remainder, '`')
        self.title = self.extract_any_text(self.remainder, '|')

        # CLASSDEF ---
        matches = re.findall(r':[A-Za-z0-9_]+', self.remainder) + \
            re.findall(r'[A-Za-z0-9_]+:', self.remainder)

        if matches:
            # only one match should be present
            if len(matches) > 1:
                self.throw_error('More than one class defined')
                # set class
            self.classdef = matches[0].replace(':', '')

         # QUICKCONNECT ---
        if re.search(r'!!![!]*', self.remainder):
            self.quickconnect = True

         # SET PROPER ID ---
        matches = re.findall(
            r'![A-Za-z0-9_]+|[A-Za-z0-9_]+!|![A-Za-z0-9_]+!',
            self.remainder)
        if matches:
           # only one match should be present
            if len(matches) > 1:
                self.throw_error('More than one tag/ID defined')
            self.ID = matches[0].replace('!', '')
            self.mandatory = True  # mark as proper ID
        else:
           # auto assigned ID
            self.ID = self.line.generate_id()

         # MARK AS MULTILINE NODE ---
        if re.search(r'(^|\s)\+(\s|$)', self.remainder):
            self.multiline = True

         # NODE SIZE ---
        matches = re.search(r'(^|\s)-([0-9.]+)(\s|$)', self.remainder)
        if matches:
            # record the numeral part of the pattern
            self.node_size = float(matches[2])

         # BRACKETS ---
        matches = re.findall(r'[\(\[\<\{]', self.remainder)

        if matches:
           # only count first type of brackets that match
            self.node_type = matches[0]
            self.node_type_variant = matches.count(self.node_type)

         # Register Pointers ---
        for result in self.find_all_pointers(self.remainder):
            self.pointers.append(Pointer(None))  # initalize empty pointer
            self.pointers[-1].manually_register(result)  # set pointer to ID

         # Register References ---
        for result in self.find_all_references(self.remainder):
            # initalize empty reference
            self.references.append(Reference(None))
            self.references[-1].manually_register(result)  # set to ID

         # combine all the data from another graphNode into this one

    def merge_with(self, otherGraphNode):
        # SCRIPT -----
        if otherGraphNode.script:
            if self.script:
                self.script += otherGraphNode.script
            else:
                self.script = otherGraphNode.script

         # SUMMARY -----
        if otherGraphNode.summary:
            if self.summary:
                self.summary += otherGraphNode.summary
            else:
                self.summary = otherGraphNode.summary

         # TITLES -----
        if otherGraphNode.title:
            if self.title:
                otherGraphNode.throw_error(
                    "Multiple titles assigned to one node")
            else:
                self.title = otherGraphNode.title

         # CLASSDEF -----
        if otherGraphNode.classdef:
            if self.classdef:  # and self.classdef != otherGraphNode.classdef:
                otherGraphNode.throw_error(
                    "Multiple classes assigned to one node")
            else:
                self.classdef = otherGraphNode.classdef

         # QUICKCONNECT -----
        self.quickconnect = self.quickconnect or otherGraphNode.quickconnect

        # Unique IDs/Tags -----
        if otherGraphNode.mandatory:  # if other has unique ID
           # if unique ID is already assigned
            if self.mandatory:
                otherGraphNode.throw_error(
                    "Multiple Tags/IDs assigned to one node")
            else:
                self.mandatory = True
                self.ID = otherGraphNode.ID

         # Multiline Status -----
            # if next line is multiline, the main line is multiline.
        self.multiline = otherGraphNode.multiline  # needed for consolidation algorithm

        # Node Size -----
        if otherGraphNode.node_size:
            if self.node_size:
                otherGraphNode.throw_error(
                    "Multiple Node Sizes set for one node")
            else:
                self.node_size = otherGraphNode.node_size

         # Node Type -----
        if otherGraphNode.node_type:
            if self.node_type == otherGraphNode.node_type:  # ignore brackets of different type after self
                # account for additional brackets
                self.node_type_variant += otherGraphNode.node_type_variant
            else:
                self.node_type = otherGraphNode.node_type
                self.node_type_variant = otherGraphNode.node_type_variant

         # Pointers and References -----
        self.pointers += otherGraphNode.pointers
        self.references += otherGraphNode.references

        # if this is a multiline node, i.e. has a '+'

    def is_multiline(self):
        return self.multiline

        # if this GraphNode is a QuickConnect Point

    def is_quickconnect_point(self):
        return self.quickconnect

        # return mermaid ID (auto?)assigned to node

    def get_ID(self):
        return self.ID

        # Node class setters and getters
    def get_class(self):
        return self.classdef

    def set_class(self, class_string):
        self.classdef = class_string

    def is_displaying(self, summary=False):
        if self.quickconnect or self.mandatory:
            return True
        if summary and self.summary:
            return True
        if not summary and self.script:
            return True
        return False  # this node is not being shown in the graph

    def apply_formatting(self, text):
        # REPLACE SPECIAL CHARS ----------
        # (bold, italics, underline, strikethrough)

        # mimics a <hr> tag, no closing newline tag
        hr_tag = '<b><s>' + '&nbsp;'*18 + '</s></b>'

        for pattern, open_tag, close_tag in [('\\b', '<b>', '</b>'),
                                             ('\\i', '<i>', '</i>'),
                                             ('\\u', '<u>', '</u>'),
                                             ('\\s', '<s>', '</s>'),
                                             ('\\~', '<small>', '</small>'),
                                             ('\\!', '<big>', '</big>'),
                                             ('\\^', '<sup>', '</sup>'),
                                             ('\\_', '<sub>', '</sub>'),
                                             ('\\|', hr_tag, None),
                                             ('\\n', '<br>', None),
                                             ('"', '&quot;', None)]:
            apply_open_tag = True  # true if next tag is open tag, false if next word is not open tag
            if not close_tag:  # some tags have the only one tag, so duplicate it
                close_tag = open_tag
            while text.find(pattern) > -1:
                if apply_open_tag:
                    apply_open_tag = False  # next tag is closing tag
                    text = text.replace(pattern, open_tag, 1)
                else:
                    apply_open_tag = True  # next tag is open tag
                    text = text.replace(pattern, close_tag, 1)

        return text

    def get_mermaid_text(self, summary=False):
        # UNRELATED: throw error if node has no text at all
        if not self.script and not self.summary:
            self.line.throw_error(
                "No Script or Summary Text associated with this node.")

           # if node isn't supposed to be displayed in script
        if not self.is_displaying(summary):
            return "%% N/D"

        nodetext = ""

        if summary and self.summary:
            nodetext = self.summary
        elif not summary and self.script:
            nodetext = self.script
        else:
            nodetext = " "  # empty node that needs to be displayed for linking

        if self.title:
            # nodetext = self.title + '\|' + nodetext # ESCAPE ERROR
            nodetext = '\\u\\b' + self.title + '\\u\\b\n' + nodetext

        # split text into a list of lines
            # NOTE also splits on '\|'
            # and behaves as if two '\n' are automatically inserted at the start and end of '\|'
            # NOTE change this if the newline character changes from '\n'
        # nodetext = nodetext.splitlines() # always returns a list
        nodetext = [x for x in re.split(r'(\n|\\\|)', nodetext) if x != '\n']

        # APPLY WORD WRAP ----------
        if self.node_size:
            wordwrap = self.node_word_wrap * self.node_size
        else:
            wordwrap = self.node_word_wrap

        wordwrapped = ""  # single string with word wrapping applied

        skip = False  # used to ignore special characters when word wrapping

        softindex = 0
        for line in nodetext:
            for char in line:
                # wrap point
                if char == ' ' and softindex > wordwrap:
                    wordwrapped += '<br>'
                    softindex = 0
                 # regular char
                else:
                    wordwrapped += char

                # ignore special characters tags
                if char == '\\':
                    skip = True
                    continue
                elif skip:  # also skip the character after the \
                    if char == 'n':  # make wordwrapping account for \n newline characters
                        softindex = 0
                    skip = False
                    continue

                softindex += 1
           # newline
            softindex = 0
            wordwrapped += '<br>'  # newlines at end of text do not get rendered

        wordwrapped = self.apply_formatting(wordwrapped)

        # Add DOUBLE QUOTES ---------

        wordwrapped = '"' + wordwrapped + '"'

        # APPLY BRACKETS ---------

        node = ""  # line that gets entered into mermaid file.

        # default self.node_type: rounded edges
        if not self.node_type:
            node = '(' + wordwrapped + ')'

        elif self.node_type == '(':
            if self.node_type_variant <= 1:  # stadium
                node = '([' + wordwrapped + '])'
            elif self.node_type_variant == 2:  # circle
                node = '((' + wordwrapped + '))'
            else:  # cylinder
                node = '[(' + wordwrapped + ')]'

        elif self.node_type == '[':
            if self.node_type_variant <= 1:  # normal
                node = '[' + wordwrapped + ']'
            else:  # subroutine
                node = '[[' + wordwrapped + ']]'

        elif self.node_type == '<':
            if self.node_type_variant <= 1:  # hexagon
                node = '{{' + wordwrapped + '}}'
            elif self.node_type_variant == 2:  # rhombus
                node = '{' + wordwrapped + '}'
            else:  # asymmetric
                node = '>' + wordwrapped + ']'

        else:  # {
            if self.node_type_variant <= 1:  # parallelogram
                node = '[/' + wordwrapped + '/]'
            elif self.node_type_variant == 2:  # alt parallelogram
                # node = '[\\' + wordwrapped + '\]'  # ESCAPE ERROR
                node = '[\\' + wordwrapped + '\\]'
            elif self.node_type_variant == 3:  # trapezoid
                node = '[/' + wordwrapped + '\\]'
            else:  # alt trapezoid
                node = '[\\' + wordwrapped + '/]'

        # ID + CLASS -----------

        node = self.ID + node + ":::" + self.classdef

        return node

        # Get some mermaid text that links two graph nodes together

    def get_mermaid_link(self, summary=False):
        link = None  # link to child or lower
        response = ""  # string to return
        # point where references connect to (self [if displaying], or lower)
        joinpoint = self.get_descendant_link(summary)

        # references connect here even if node isn't displaying.
        if joinpoint:
           # also add references to response
            for reference in self.references:
                response += reference.generate_mermaid_link_to(joinpoint) + ';'
                # joinpoint = self.get_descendant_link(summary)

        if response == ';':  # DUMB EDGE CASE TODO add better solution?
            response = ''

        if not self.is_displaying(summary):
            return response + "\n%% N/A"

        ### === This Runs if displaying === ###

         # get link to child (or lower)
        if self.child and not self.terminating():
            link = self.child.get_descendant_link(summary)

        if not link:  # sections and patchbays return None
            link = DescendantLink(None)

        # also connect to pointers here IF NODE *IS* DISPLAYING
        if self.pointers:
            for pointer in self.pointers:
                link.merge_with(pointer.convert_to_descendant_link())

         # generate the link text
        response += link.generate_mermaid_link_from(self.ID)

        return response

        # get link to next nodes in chain
        # summary: True if creating summary graph, False if generating script

    def get_descendant_link(self, summary=False):
        # send back Descendant_link to self.ID, or child

        response = None

        # no need to attach pointers if node is going to be displayed
        if self.is_displaying(summary):
            return DescendantLink(self.ID)  # done

         # if no terminating pointers, and-
        elif self.child and not self.terminating():
           # get next displayable node in chain
            response = self.child.get_descendant_link(summary)

        if not response:  # sections and patchbays return None
            response = DescendantLink(None)

        # also attach pointers to returning responses IF NODE ISN'T DISPLAYING
        if self.pointers:
            for pointer in self.pointers:
                response.merge_with(pointer.convert_to_descendant_link())

        return response

    # returns the node text for the node in script mode

    def get_text(self):
        if self.script:
            return self.script
        else:
            return ""

    # returns the script node text with special chars converted to html tags
    def get_rich_text(self):
        if self.script:
            return self.apply_formatting(self.script)
        else:
            return ""

         # returns linenumber as int
    def get_linenumber(self):
        return self.line.get_linenumber()

        # number of words (roughly) in the node script text
    def get_word_count(self):
        text = self.get_text()

        # replace characters that split a sentence
        text = re.sub(r'\\[n|\|]', ' ', text)
        # remove special characters and string formatting
        text = re.sub(r'\\.', '', text)

        # count number of items that are separated by spaces
        return (len(text.split()))

    def __repr__(self):
        # TODO Implement this
        return "__NODE__" + str(self.line) + \
            "\n\tScript: " + str(self.script) + \
            "\n\tSummary: " + str(self.summary) + \
            "\n\tClass: " + str(self.classdef) + \
            "\n\tID: " + str(self.ID) + \
            "\n\tMandatory: " + str(self.mandatory) + \
            "\n\tQuickConnect: " + str(self.quickconnect) + \
            "\n\tMultiline: " + str(self.multiline) + \
            "\n\tNodesize: " + str(self.node_size) + \
            "\n\tNode type: " + str(self.node_type) + \
            "\n\tPointers:\n" + str(self.pointers) + \
            "\n\tReferences:\n" + str(self.references)

    # ______________________ ReportItem


class ReportItem:

    # ScriptObject can be either GraphNode or Comment
    def __init__(self, ScriptObject):
        self.source = ScriptObject
        self.linenumber = ScriptObject.get_linenumber()
        self.text = ScriptObject.get_rich_text()  # ready to display

        # getter
    def get_text(self):
        return self.text

        # setter
    def set_text(self, text):
        self.text = text

        # get markdown formatted text to put into Todo/Remember report
    def get_entry(self):
        tab = '&nbsp;' * 4  # to separate content from line indicators

        # generate line indicator:
        result = '#### line: ' + str(self.linenumber)
        if isinstance(self.source, GraphNode):
            result += ' [ ' + self.source.get_class() + ' ]'

        return result + '\n' + tab + self.text.replace('<br>', '<br>' + tab)

        # true if Keyword exists in self.text
    def find(self, query):
        if self.text.find(query) > -1:
            return True
        return False

        # highlight all instances of target in self.text with color
    def highlight(self, target, color):
        self.text = self.text.replace(
            target,
            '<span style="background-color: ' + color + '">' +
            target + '</span>'
        )


#
#
#
#
#
#
#
#
# START ADAPTING FROM HERE:
# NOTE: ------------------ GET DATA FROM NODE --------------
# NOTE: this is the point where the merman script data is injected from Nodejs main process
merman_filetext = filedata


print("[ Initalization Complete ]")

# --------- THE REST OF THIS RUNS SEQUENTIALLY: --------

print("> Reading Lines.......\t", end='')

unfiltered = []  # all the lines in the script, with comments

# read, clean and assign a linenumber to each line in the mermaid file.
for index, text in enumerate(merman_filetext):
    line = MermanLine(text.strip(), line_number=index+1)

    # if not line.is_blank():
    unfiltered.append(line)


# ------ SEPERATE COMMENTS -------

unclassified = []  # all the lines in the script without comments
comments = []  # just the comments in the script
in_block_comment = False  # currently in a block comment

for line in unfiltered:  # for each line in script.

    # START / END of block comment
    if line.is_block_comment_marker():
        # do not record marker in script or comments

        if in_block_comment:  # exit block comment
            in_block_comment = False

        else:  # initialize block comment
            in_block_comment = True
            comments.append(Comment())  # create blank comment at end

        # MIDDLE of block comment
    elif in_block_comment:
        comments[-1].combine(line)  # add line to current comment object

        # SINGLE line comment
    elif line.is_comment():
        comments.append(Comment(line))

    # append all non-comment lines to script
        # (Ignore Blank lines)
    elif not line.is_blank():
        unclassified.append(line)


# ------ CLASSIFY SCRIPT LINES -------

    # for a normal line in the script, determine what type of command it is

def classify(line):
    global Style
    global Section
    global Patchbay
    global Split
    global Branch
    global Join
    global Subgraph
    global Pointer
    global Reference
    global GraphNode

    if line.is_style():
        return Style(line)
    if line.is_section():
        return Section(line)
    if line.is_patchbay():
        return Patchbay(line)
    if line.is_split():
        return Split(line)
    if line.is_branch():
        return Branch(line)
    if line.is_join():
        return Join(line)
    if line.is_subgraph():
        return Subgraph(line)
    if line.is_pointer():
        return Pointer(line)
    if line.is_reference():
        return Reference(line)

    # otherwise, treat as node
    return GraphNode(line)


########################## FOR PREPROCESSOR ANALYZE FUNCTION #####

if 'analyze_only' in locals() and analyze_only:
    for line in unclassified:
        global Object
        OUTPUTS = vars(classify(line))
        # OUTPUTS = json.dumps(["hello", "world"])

# END OF PREPROCESSOR ANALYZE FUNCTION

else:
    unconsolidated = []  # with multiline nodes, and pointers + references

    for line in unclassified:
        unconsolidated.append(classify(line))


# -------- linking Subgraphs ---------------
# check that all Subgraph statements have a closing end tag

    stack = []
    for line in unconsolidated:
        if isinstance(line, Subgraph):
            if line.is_start():  # if opening tag
                stack.append(line)  # increase level
            else:  # if closing tag
                try:  # TODO do better exception handling for this
                    stack.pop()  # decrease level
                except:  # but if no opening statement found
                    line.throw_error(
                        "No starting subgraph statement found for this line")

    if len(stack) != 0:  # if at least one starting subgraph statement doesn't have and end statement
        # throw an error for the most recent starting statement.
        stack.pop().throw_error("Cant find closing subgraph statement for this line.")


# -------- Combine Multiline Nodes and
#                Consolidate Multiline References and Pointers-------

    script = []  # final object instance and position of the lines
# the previous Node registered in the script (if it can have other nodes consolidated into it)
    last_line = None

    for current_line in unconsolidated:

        # if a multiline node is expected here
        if isinstance(last_line, GraphNode) and last_line.is_multiline():
            if isinstance(current_line, GraphNode):  # combine with next graph node
                last_line.merge_with(current_line)
            else:
                current_line.throw_error("Expected a multiline node")

        # A node that other nodes can merge into (GraphNode, Join)
        elif isinstance(current_line, Linkable):
            last_line = current_line
            script.append(current_line)  # add to script

        # multiline References/Pointers
        elif isinstance(current_line, Link):
            if last_line:  # and last_line is Graphnode or Join
                last_line.register_reference_or_pointer(current_line)
            else:
                current_line.throw_error(
                    "Parent Node not found for Pointer/Reference")

        else:
            last_line = None
            script.append(current_line)  # add to script

    print("[OK]")


# -------- Resolve Quick Connects ------

    print("> Building Graph.......\t", end='')

# the last GraphNode quickconnect point that was encountered
    active_quickconnect_point = None
    to_link = []  # all quickconnect-next nodes that need to be connected

# order of operations important! lines can be simultaneously:
# quickconnect-next, quickconnect-previous and a quickconnect point
# so if current node is quickconnect point:
# resolve previous quickconnect-prev/next links
# register self as active_quickconnect_point
# then note down quickconnect-next links (for next point)
    for line in script:

        # resolve quickconnect-previous
        if isinstance(line, Linkable) and line.is_quickconnect_previous():
            # quickconnect point exists
            if active_quickconnect_point:
                line.set_quickconnect_previous_id(
                    active_quickconnect_point.get_ID())
            # quickconnect point not set yet
                # TODO move this functionality into class?
            else:
                line.set_quickconnect_previous_id(None)

            # set current line as new quickconnect point
                # only GraphNodes can be quickconnect points
        if isinstance(line, GraphNode) and line.is_quickconnect_point():
            # resolve quickconnect-next links that connect to here
            for node in to_link:
                node.set_quickconnect_next_id(line.get_ID())
            to_link = []  # reset pending quickconnect-next links
            active_quickconnect_point = line  # this is new quickconnect point

        # note the links that should connect to the next quickconnect point
        if isinstance(line, Linkable) and line.is_quickconnect_next():
            to_link.append(line)

# resolve any left over quickconnect-next points
            # TODO move this functionality into class?
    for node in to_link:
        node.set_quickconnect_next_id(None)


# -------- Initialize Parent-Child Relationships ------

    for index in range(len(script)-1):  # for last node, child is None
        script[index].set_child(script[index+1])


# -------- AutoAssign Class to GraphNodes ------

    current_autoclass = 'none'  # default value for class

    for line in script:
        if isinstance(line, GraphNode):
            if line.get_class():
                current_autoclass = line.get_class()
            else:
                line.set_class(current_autoclass)
        # otherwise ignore


# -------- Map Splits and Joins ---------

            # recursive function throws error (from split line) if end of array is encountered before join:

    def map_split(splitpoint, index, script):
        previous_line = None  # the previous line in the loop
        endpoints = []  # mermaid lines that connect to the closing join

        try:
            while True:
                line = script[index]

                if isinstance(line, Branch):  # branch
                    endpoints.append(previous_line)  # end last line
                    splitpoint.register_branch(line)  # start new line

                elif isinstance(line, Join):  # join
                    for endpoint in endpoints:
                        # override current child and link endpoints to join node
                        if endpoint:
                            endpoint.set_child(line)
                    return index  # return position to continue from

                elif isinstance(line, Split):  # another split
                    index = map_split(line, index+1, script)

                previous_line = line
                index += 1

        except:
            splitpoint.throw_error(
                "Expected a join/done point. No join point found")


# search through script for Split points ---
    script_length = len(script)
    index = 0

    while index < script_length:
        if isinstance(script[index], Split):
            index = map_split(script[index], index+1, script)

        index += 1

    print('[OK]')


# ------- Create Script File --------
#
#
# OUTPUT PHASE STARTS HERE
#
#

    OUTPUTS = {}


# ---------- Main Script Graph --------

    print('[ Extracting Script ]')

    OUTPUTS['script'] = []

    OUTPUTS['script'].append('graph TD\n')
    for line in script:
        OUTPUTS['script'].append(line.get_mermaid_text(summary=False) + '\n')

# ALWAYS Generate links after lines (or subsection bugs out!!!)
    for line in script:
        OUTPUTS['script'].append(line.get_mermaid_link(summary=False) + '\n')


# ---------- Generate Summary Lines and Links --------

    print('[ Extracting Summary ]')

    OUTPUTS['summary'] = []

    OUTPUTS['summary'].append('graph TD\n')
    for line in script:
        OUTPUTS['summary'].append(line.get_mermaid_text(summary=True) + '\n')

# ALWAYS Generate links after lines (or subsection bugs out!!!)
    for line in script:
        OUTPUTS['summary'].append(line.get_mermaid_link(summary=True) + '\n')

# ------------ Generate Assorted Graph -----------

# all graphNodes in script, sorted by class

# NOTE NOTE NOTE After this step, the script (the connections between nodes) will be completely destroyed

    print('[ Creating Sorted ]')

    OUTPUTS['sorted'] = []

# INIT --
    assorted = {}  # all Graphnodes sorted by class
    styles = []  # all classdef lines

# SORT --
# all graphNodes in script
    for line in script:
        if isinstance(line, Style):
            styles.append(line)
            continue

        if not isinstance(line, GraphNode):
            continue

        nodeclass = line.get_class()
        # append to end of appropriate class list
        assorted[nodeclass] = assorted.get(nodeclass, []) + [line]

# WRITE --
    OUTPUTS['sorted'].append('graph TD\n')

# all the node styles
    for line in styles:
        OUTPUTS['sorted'].append(line.get_mermaid_text(summary=False) + '\n')

# for each list of sorted nodes, join all nodes together directly
        # without pointers or references. do this manually.
    for nodeclass in assorted:

        # TODO   --------------- SORT BY NODE SHAPE HERE!
        # TODO   --------------- SORT BY NODE TEXT HERE!
        # OR is it more important to just leave everything in the order that it appears? make have it as a flag? with a button? full sort, sequential sort?

        # write each node
        for node in assorted[nodeclass]:
            OUTPUTS['sorted'].append(
                node.get_mermaid_text(summary=False) + '\n')

        # string all nodes in category together
        OUTPUTS['sorted'].append(
            "-->".join([x.get_ID()
                        for x in assorted[nodeclass]
                        if x.is_displaying(summary=False)])
        )
        OUTPUTS['sorted'].append('\n')

        # ---------- Generate Todo Report --------

    if True:

        print('[ Generating Todo Report ]')

        todo_items = []  # all nodes with remember keywords

        # COMMENTS --
        # all the way from SEPERATE COMMENTS section above
        for comment in comments:
            if re.search(   # comment TODO keywords: {ignore REVIEWED}
                    r'(TODO|REVIEW|XXX|FIX|REMOVE|INCOMPLETE)(?!ED)',
                    comment.get_text()):
                todo_items.append(comment)

        # NODES --
        for node in [x for x in script if isinstance(x, GraphNode)]:
            if re.search(   # Node Text TODO keywords:
                    r'(XXX|NOUN|FORESHADOWING|BACKSTORY|WORLDBUILDING)',
                    node.get_text()):
                todo_items.append(node)

        # SORTING Comments and Nodes into appropriate positions --
        todo_items.sort(key=lambda x: x.get_linenumber())

        # the order of this determines the order that is printed in the report

        titles = {  # printed before all the content in each category
            # both
            'combined': '## <u>All Incomplete Items</u>',  # all items, in order
            'misc': "## <u>Miscellaneous</u>",
            # comments -
            'todo': '## <u>TODO Items</u>',
            'review': '## <u>Review Notes</u>',
            'fix': '## <u>To Fix</u>',
            'incomplete': '## <u>Still Incomplete</u>',
            'remove': '## <u>To Remove</u>',
            # nodes
            'script': '## <u>Missing Script Elements</u>',  # not implemented in categories
            'noun': '### <u>Nouns</u>',
            'foreshadowing': '### <u>Foreshadowing</u>',
            'backstory': '### <u>Backstory</u>',
            'worldbuilding': '### <u>World Building</u>'
        }

        categories = {
            # comments -
            'todo': [],
            'review': [],
            'fix': [],
            'remove': [],
            'incomplete': [],
            # nodes
            'noun': [],
            'foreshadowing': [],
            'backstory': [],
            'worldbuilding': [],
            # both
            'combined': [],  # all items, in order
            'misc': []
        }

        # -- Sort items --

        for node in todo_items:
            item = ReportItem(node)  # easier to handle form

            if isinstance(node, GraphNode):  # GRAPHNODE ---
                # items.set_text('```plain\n'+ items.get_text() +'\n```')
                # differentiate Graphnodes from comments in report
                # item.set_text('> '+ item.get_text())

                if item.find('NOUN'):
                    item.highlight('NOUN', '#cc66ff')  # purple
                    categories['noun'].append(item)  # instances are mutable

                if item.find('FORESHADOWING'):
                    item.highlight('FORESHADOWING', '#cc66ff')  # purple
                    categories['foreshadowing'].append(
                        item)  # instances are mutable

                if item.find('BACKSTORY'):
                    item.highlight('BACKSTORY', '#cc66ff')  # purple
                    categories['backstory'].append(
                        item)  # instances are mutable

                if item.find('WORLDBUILDING'):
                    item.highlight('WORLDBUILDING', '#cc66ff')  # purple
                    categories['worldbuilding'].append(
                        item)  # instances are mutable

            else:  # COMMENT NODE ---
                if item.find('TODO'):
                    item.highlight('TODO', '#66ff66')  # green
                    categories['todo'].append(item)  # instances are mutable

                if item.find('REVIEW'):
                    item.highlight('REVIEW', '#66ccff')  # blue
                    categories['review'].append(item)  # instances are mutable

                if item.find('FIX'):
                    item.highlight('FIX', '#ff5050')  # red
                    categories['fix'].append(item)  # instances are mutable

                if item.find('REMOVE'):
                    item.highlight('REMOVE', '#ffcc00')  # yellow
                    categories['remove'].append(item)  # instances are mutable

                if item.find('INCOMPLETE'):
                    item.highlight('INCOMPLETE', '#ff6600')  # orange
                    categories['incomplete'].append(
                        item)  # instances are mutable

            # BOTH comments and GraphNodes
            if item.find('XXX'):
                item.highlight('XXX', '#b3b3b3')  # grey
                categories['misc'].append(item)

            categories['combined'].append(item)  # all items together

            # END OF FOR LOOP

        # --- WRITE TO FILE ---
        #
        OUTPUTS['todo'] = []

        OUTPUTS['todo'].append('# Todo Report\n')  # title

        for category in titles:
            # write section title
            OUTPUTS['todo'].append(titles[category] + '\n\n')

            # for each category of items
            for item in categories.get(category, []):
                # write item entry to report
                OUTPUTS['todo'].append(item.get_entry() + '\n\n')

        # ---------- Generate Remember Report --------

        print('[ Generating Remember Report ]')

        items = []  # all comments with remember keywords

        # COMMENTS --
        for comment in comments:
            if re.search(   # comment Remember keywords:
                    r'(XXX|NOTE|REMEMBER|WARNING|MAYBE)',
                    # r'\W(XXX|NOTE|REMEMBER|WARNING|MAYBE)(\W|$)',
                    comment.get_text()):
                items.append(comment)

        # the order of this determines the order that is printed in the report
        titles = {
            'combined': '## <u>All Items</u>',  # all items, in order
            'misc': "## <u>Miscellaneous</u>",
            'note': '## <u>Notes</u>',
            'remember': '## <u>To Remember</u>',
            'warning': '## <u>Warnings</u>',
            'maybe': '## <u>Maybe\'s and Possibilities</u>',
        }

        categories = {
            'combined': [],
            'misc': [],
            'note': [],
            'remember': [],
            'warning': [],
            'maybe': []
        }

        # -- Sort items --

        for comment in items:
            item = ReportItem(comment)

            if item.find('XXX'):
                item.highlight('XXX', '#b3b3b3')  # grey
                categories['misc'].append(item)

            if item.find('NOTE'):
                item.highlight('NOTE', '#ffcc00')  # yellow
                categories['note'].append(item)

            if item.find('REMEMBER'):
                item.highlight('REMEMBER', '#ff6600')  # orange
                categories['remember'].append(item)

            if item.find('WARNING'):
                item.highlight('WARNING', '#ff5050')  # red
                categories['warning'].append(item)

            if item.find('MAYBE'):
                item.highlight('MAYBE', '#66ff66')  # green
                categories['maybe'].append(item)

            categories['combined'].append(item)

            # END OF FOR LOOP

        # --- WRITE TO FILE ---
        #
        OUTPUTS['remember'] = []

        OUTPUTS['remember'].append('# Remember Report\n')  # title

        for category in titles:
            # write section title
            OUTPUTS['remember'].append(titles[category] + '\n\n')

            # for each category of items
            for item in categories.get(category, []):
                # write item entry to report
                OUTPUTS['remember'].append(item.get_entry() + '\n\n')

# ------------ Count Words -----------

    total_words = 0
    total_nodes = 0

    for node in script:

        if not isinstance(node, GraphNode):
            continue

        total_nodes += 1
        total_words += node.get_word_count()

    OUTPUTS['word_count'] = total_words
    OUTPUTS['node_count'] = total_nodes

    print("Word Count: ", total_words)
    print("Total Nodes: ", total_nodes)

    print("< DONE >")

# return OUTPUTS


# UPDATE MERMAN SYNTAX, WITH UPDATED independent pointers, that start with '-' like a bullet point list (indicate these special pointers with italics)
# - ^ID "optional"
# - Quick connects:
# IDs
# Pointers and References

# also titles? \hello\ "world"
# or |hello| "world?"    No, [A|B] is used a lot

# special characters: [^\\]\\
# or just [right now]: [binsu~!^_\]

# also XXX is just a general tag that makes a comment show up in both Todo.md and Remember.md, change the color for XXX to reflect this... like deep purple text, or yellow text? or is it even necessary?

# use lines that start with - or ? as greentext?

# WARNING: code adaptation incomplete, test this code out with the full proper test files to check if all globals are added properly

# WARNING? code sometimes produces double semicolons or sth idk fix it EDIT: seems fine

# NOTE: filedata is the data passed from node to the python code when running in local scope, the value of the last statement is returned
#
# run(filedata)

OUTPUTS
