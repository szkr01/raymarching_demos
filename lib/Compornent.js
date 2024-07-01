import React from 'react';

const MarkdownLikeList = ({ children }) => {
    const renderListItems = (items) => {
        return React.Children.map(items, (child, index) => {
            if (React.isValidElement(child)) {
                if (child.type === 'li') {
                    // List item
                    return React.cloneElement(child, {
                        className: `${child.props.className || ''} ${child.props.ordered ? 'list-decimal' : 'list-disc'
                            } ml-4`,
                        key: index,
                    });
                } else if (child.type === 'ul' || child.type === 'ol') {
                    // Nested list
                    return React.cloneElement(child, {
                        children: renderListItems(child.props.children),
                        key: index,
                    });
                } else {
                    // Other elements (like paragraphs)
                    return child;
                }
            }
            return child;
        });
    };

    return <div className="markdown-like-list">{renderListItems(children)}</div>;
};

const ListItem = ({ children, ordered }) => (
    <li ordered={ordered}>{children}</li>
);

MarkdownLikeList.Item = ListItem;

export default MarkdownLikeList;