import React from 'react';
import { Icon, Card, Text, Button } from '@blueprintjs/core';
import styles from './styles.scss';
export const AddCardTrigger = function ({ onClick, highlight, label }) {
    return (React.createElement("div", { className: styles.addCardTriggerContainer },
        React.createElement(AddCardTriggerButton, { onClick: onClick, highlight: highlight, label: label })));
};
// If using separately from AddCardTrigger, wrap into element with addCardTriggerContainer class
export const AddCardTriggerButton = function ({ onClick, highlight, label }) {
    return React.createElement(Button, { icon: "plus", onClick: onClick, text: highlight ? (label || undefined) : undefined, minimal: highlight ? true : undefined, title: label ? label.toString() : "", intent: highlight ? "primary" : undefined, className: `${styles.addCardTrigger} ${highlight ? styles.addCardTriggerHighlighted : ''}` });
};
export const SimpleEditableCard = function (props) {
    let contents;
    const contentsClassName = `${styles.cardContents} ${props.contentsClassName || ''}`;
    if (props.extended) {
        contents = React.createElement("div", { className: contentsClassName }, props.children);
    }
    else {
        contents = (React.createElement(Text, { ellipsize: true, className: contentsClassName }, props.children));
    }
    return (React.createElement(Card, { className: `
          ${styles.editableCard}
          ${props.minimal ? styles.editableCardMinimal : ''}
          ${props.selected ? styles.editableCardSelected : ''}
          ${props.extended ? styles.editableCardExtended : ''}
          ${props.onSelect ? styles.editableCardSelectable : ''}
          ${props.onClick ? styles.editableCardInteractive : ''}
          ${props.onDelete ? styles.editableCardDeletable : ''}
          ${props.className || ''}
        `, interactive: (props.onClick || props.onSelect) ? true : false, onClick: props.onClick || props.onSelect },
        props.icon
            ? React.createElement(React.Fragment, null,
                React.createElement(Icon, { icon: props.icon }),
                "\u2002")
            : null,
        contents,
        props.onDelete
            ? React.createElement(Button, { onClick: (evt) => {
                    props.onDelete ? props.onDelete() : void 0;
                    evt.stopPropagation();
                    return false;
                }, intent: "danger", icon: "delete", title: "Delete this item", className: styles.editableCardDeleteButton, minimal: true, small: true })
            : null));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvcmVuZGVyZXIvd2lkZ2V0cy9lZGl0YWJsZS1jYXJkLWxpc3QvaW5kZXgudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFN0QsT0FBTyxNQUFNLE1BQU0sZUFBZSxDQUFDO0FBVW5DLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBa0MsVUFBVSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFO0lBQ2xHLE9BQU8sQ0FDTCw2QkFBSyxTQUFTLEVBQUUsTUFBTSxDQUFDLHVCQUF1QjtRQUM1QyxvQkFBQyxvQkFBb0IsSUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBSSxDQUMxRSxDQUNQLENBQUM7QUFDSixDQUFDLENBQUM7QUFHRixnR0FBZ0c7QUFDaEcsTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQWtDLFVBQVUsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRTtJQUN4RyxPQUFPLG9CQUFDLE1BQU0sSUFDWixJQUFJLEVBQUMsTUFBTSxFQUNYLE9BQU8sRUFBRSxPQUFPLEVBQ2hCLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQ2xELE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUNyQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFDcEMsTUFBTSxFQUFFLFNB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OlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEljb24sIENhcmQsIFRleHQsIEJ1dHRvbiB9IGZyb20gJ0BibHVlcHJpbnRqcy9jb3JlJztcbmltcG9ydCB7IEljb25OYW1lIH0gZnJvbSAnQGJsdWVwcmludGpzL2ljb25zJztcbmltcG9ydCBzdHlsZXMgZnJvbSAnLi9zdHlsZXMuc2Nzcyc7XG5cblxuaW50ZXJmYWNlIEFkZENhcmRUcmlnZ2VyUHJvcHMge1xuICBvbkNsaWNrPzogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLFxuICBoaWdobGlnaHQ/OiBib29sZWFuLFxuICBsYWJlbD86IHN0cmluZyB8IEpTWC5FbGVtZW50LFxufVxuXG5cbmV4cG9ydCBjb25zdCBBZGRDYXJkVHJpZ2dlcjogUmVhY3QuRkM8QWRkQ2FyZFRyaWdnZXJQcm9wcz4gPSBmdW5jdGlvbiAoeyBvbkNsaWNrLCBoaWdobGlnaHQsIGxhYmVsIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmFkZENhcmRUcmlnZ2VyQ29udGFpbmVyfT5cbiAgICAgIDxBZGRDYXJkVHJpZ2dlckJ1dHRvbiBvbkNsaWNrPXtvbkNsaWNrfSBoaWdobGlnaHQ9e2hpZ2hsaWdodH0gbGFiZWw9e2xhYmVsfSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuXG4vLyBJZiB1c2luZyBzZXBhcmF0ZWx5IGZyb20gQWRkQ2FyZFRyaWdnZXIsIHdyYXAgaW50byBlbGVtZW50IHdpdGggYWRkQ2FyZFRyaWdnZXJDb250YWluZXIgY2xhc3NcbmV4cG9ydCBjb25zdCBBZGRDYXJkVHJpZ2dlckJ1dHRvbjogUmVhY3QuRkM8QWRkQ2FyZFRyaWdnZXJQcm9wcz4gPSBmdW5jdGlvbiAoeyBvbkNsaWNrLCBoaWdobGlnaHQsIGxhYmVsIH0pIHtcbiAgcmV0dXJuIDxCdXR0b25cbiAgICBpY29uPVwicGx1c1wiXG4gICAgb25DbGljaz17b25DbGlja31cbiAgICB0ZXh0PXtoaWdobGlnaHQgPyAobGFiZWwgfHwgdW5kZWZpbmVkKSA6IHVuZGVmaW5lZH1cbiAgICBtaW5pbWFsPXtoaWdobGlnaHQgPyB0cnVlIDogdW5kZWZpbmVkfVxuICAgIHRpdGxlPXtsYWJlbCA/IGxhYmVsLnRvU3RyaW5nKCkgOiBcIlwifVxuICAgIGludGVudD17aGlnaGxpZ2h0ID8gXCJwcmltYXJ5XCIgOiB1bmRlZmluZWR9XG4gICAgY2xhc3NOYW1lPXtgJHtzdHlsZXMuYWRkQ2FyZFRyaWdnZXJ9ICR7aGlnaGxpZ2h0ID8gc3R5bGVzLmFkZENhcmRUcmlnZ2VySGlnaGxpZ2h0ZWQgOiAnJ31gfVxuICAvPjtcbn07XG5cblxuaW50ZXJmYWNlIFNpbXBsZUVkaXRhYmxlQ2FyZFByb3BzIHtcbiAgaWNvbj86IEljb25OYW1lLFxuICBzZWxlY3RlZD86IGJvb2xlYW4sXG4gIG9uRGVsZXRlPzogKCkgPT4gdm9pZCxcbiAgb25TZWxlY3Q/OiAoKSA9PiB2b2lkLFxuICBvbkNsaWNrPzogKCkgPT4gdm9pZCxcbiAgbWluaW1hbD86IGJvb2xlYW4sXG4gIGV4dGVuZGVkPzogYm9vbGVhbixcbiAgY29udGVudHNDbGFzc05hbWU/OiBzdHJpbmcsXG4gIGNsYXNzTmFtZT86IHN0cmluZyxcbn1cbmV4cG9ydCBjb25zdCBTaW1wbGVFZGl0YWJsZUNhcmQ6IFJlYWN0LkZDPFNpbXBsZUVkaXRhYmxlQ2FyZFByb3BzPiA9IGZ1bmN0aW9uIChwcm9wcykge1xuICBsZXQgY29udGVudHM6IEpTWC5FbGVtZW50O1xuICBjb25zdCBjb250ZW50c0NsYXNzTmFtZSA9IGAke3N0eWxlcy5jYXJkQ29udGVudHN9ICR7cHJvcHMuY29udGVudHNDbGFzc05hbWUgfHwgJyd9YDtcblxuICBpZiAocHJvcHMuZXh0ZW5kZWQpIHtcbiAgICBjb250ZW50cyA9IDxkaXYgY2xhc3NOYW1lPXtjb250ZW50c0NsYXNzTmFtZX0+e3Byb3BzLmNoaWxkcmVufTwvZGl2PjtcbiAgfSBlbHNlIHtcbiAgICBjb250ZW50cyA9IChcbiAgICAgIDxUZXh0IGVsbGlwc2l6ZT17dHJ1ZX0gY2xhc3NOYW1lPXtjb250ZW50c0NsYXNzTmFtZX0+XG4gICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgIDwvVGV4dD5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Q2FyZFxuICAgICAgICBjbGFzc05hbWU9e2BcbiAgICAgICAgICAke3N0eWxlcy5lZGl0YWJsZUNhcmR9XG4gICAgICAgICAgJHtwcm9wcy5taW5pbWFsID8gc3R5bGVzLmVkaXRhYmxlQ2FyZE1pbmltYWwgOiAnJ31cbiAgICAgICAgICAke3Byb3BzLnNlbGVjdGVkID8gc3R5bGVzLmVkaXRhYmxlQ2FyZFNlbGVjdGVkIDogJyd9XG4gICAgICAgICAgJHtwcm9wcy5leHRlbmRlZCA/IHN0eWxlcy5lZGl0YWJsZUNhcmRFeHRlbmRlZCA6ICcnfVxuICAgICAgICAgICR7cHJvcHMub25TZWxlY3QgPyBzdHlsZXMuZWRpdGFibGVDYXJkU2VsZWN0YWJsZSA6ICcnfVxuICAgICAgICAgICR7cHJvcHMub25DbGljayA/IHN0eWxlcy5lZGl0YWJsZUNhcmRJbnRlcmFjdGl2ZSA6ICcnfVxuICAgICAgICAgICR7cHJvcHMub25EZWxldGUgPyBzdHlsZXMuZWRpdGFibGVDYXJkRGVsZXRhYmxlIDogJyd9XG4gICAgICAgICAgJHtwcm9wcy5jbGFzc05hbWUgfHwgJyd9XG4gICAgICAgIGB9XG4gICAgICAgIGludGVyYWN0aXZlPXsocHJvcHMub25DbGljayB8fCBwcm9wcy5vblNlbGVjdCkgPyB0cnVlIDogZmFsc2V9XG4gICAgICAgIG9uQ2xpY2s9e3Byb3BzLm9uQ2xpY2sgfHwgcHJvcHMub25TZWxlY3R9PlxuXG4gICAgICB7cHJvcHMuaWNvblxuICAgICAgICA/IDw+PEljb24gaWNvbj17cHJvcHMuaWNvbn0gLz4mZW5zcDs8Lz5cbiAgICAgICAgOiBudWxsfVxuXG4gICAgICB7Y29udGVudHN9XG5cbiAgICAgIHtwcm9wcy5vbkRlbGV0ZVxuICAgICAgICA/IDxCdXR0b25cbiAgICAgICAgICAgIG9uQ2xpY2s9eyhldnQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICBwcm9wcy5vbkRlbGV0ZSA/IHByb3BzLm9uRGVsZXRlKCkgOiB2b2lkIDA7XG4gICAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIGludGVudD1cImRhbmdlclwiXG4gICAgICAgICAgICBpY29uPVwiZGVsZXRlXCJcbiAgICAgICAgICAgIHRpdGxlPVwiRGVsZXRlIHRoaXMgaXRlbVwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e3N0eWxlcy5lZGl0YWJsZUNhcmREZWxldGVCdXR0b259XG4gICAgICAgICAgICBtaW5pbWFsPXt0cnVlfVxuICAgICAgICAgICAgc21hbGw9e3RydWV9XG4gICAgICAgICAgLz5cbiAgICAgICAgOiBudWxsfVxuXG4gICAgPC9DYXJkPlxuICApO1xufTtcbiJdfQ==