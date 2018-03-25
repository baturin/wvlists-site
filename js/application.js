
application = {
    init: function() {
        var self = this;
        this.bindHandlers();
        this._listItems = [];
    },

    bindHandlers: function() {
        var self = this;

        $('#viewCulturalHeritageCategory').click(function() {
            self.viewCulturalHeritageCategory(self._getCurrentCulturalHeritageCategory());
        });
        $('#filter').change(function() {
            self.applyFilter();
        });
    },

    /**
     * View lists of specified cultural heritage category (Wikivoyage page).
     *
     * @param category category name (Wikivoyage page name)
     */
    viewCulturalHeritageCategory: function(category) {
        var self = this;
        wikivoyageApi.getPage(
            'Культурное_наследие_России/' + category,
            function(data) {
                var listItemsData = self.parseLists(data);

                self.resetListItems();
                listItemsData.forEach(function(listItemData) {
                    self.addListItem(listItemData);
                });

                self.applyFilter();

                runSequence(
                    self._listItems.map(function(listItem) {
                        return function(onSuccess) {
                            self.loadListItemImages(listItem, onSuccess);
                        }
                    })
                );
            }
        );
    },

    loadListItemImages: function(listItem, onSuccess) {
        var self = this;
        runSequence([
            function(onSuccess) {self.loadMainImage(listItem, onSuccess)},
            function(onSuccess) {self.loadImagesFromCommonsCategory(listItem, onSuccess)},
            function(onSuccess) {self.loadImagesFromWLMCategory(listItem, onSuccess)}
        ], onSuccess);
    },

    loadMainImage: function(listItem, onSuccess) {
        var self = this;
        if (!listItem.data.image) {
            onSuccess();
        } else {
            wikivoyageApi.getImageInfo('File:' + listItem.data.image, function(imageInfo) {
                self.setMainImage(listItem, imageInfo);
                onSuccess();
            });
        }
    },

    loadImagesFromWLMCategory: function(listItem, onSuccess) {
        var self = this;
        if (!listItem.data.knid) {
            onSuccess();
        } else {
            commonsApi.getCategoryImages(
                'WLM/' + listItem.data.knid, 'max',
                function (images) {
                    self.loadImages(listItem, images, 'wlm', onSuccess);
                }
            );
        }
    },

    loadImagesFromCommonsCategory: function(listItem, onSuccess) {
        var self = this;
        if (!listItem.data.commonscat) {
            onSuccess();
        } else {
            commonsApi.getCategoryImages(
                listItem.data.commonscat, 'max',
                function (images) {
                    self.loadImages(listItem, images, 'commons', onSuccess);
                }
            );
        }
    },

    loadImages: function(listItem, images, categoryType, onSuccess) {
        var self = this;
        commonsApi.getImagesInfo(images, function(imagesInfo) {
            self.addImages(listItem, imagesInfo, categoryType);
            onSuccess();
        });
    },

    applyFilter: function() {
        var filterValue = $('#filter').val();
        var filterFunction = function (listItem) {
            return true;
        };
        if (filterValue === 'without-images') {
            filterFunction = function(listItem) {
                return !listItem.data.image;
            }
        } else if (filterValue === 'without-images-with-gallery') {
            filterFunction = function(listItem) {
                return !listItem.data.image && listItem.images.length > 0;
            }
        } else if (filterValue === 'without-coordinates') {
            filterFunction = function(listItem) {
                return !listItem.lat || !listItem.long;
            }
        }

        this._listItems.forEach(function(listItem) {
            if (filterFunction(listItem)) {
                listItem.html.listItemBlock.show();
            } else {
                listItem.html.listItemBlock.hide();
            }
        });
    },

    resetListItems: function() {
        this._listItems = [];
        $('#lists').html('');
    },

    addListItem: function(listItemData) {
        var listItem = {};

        listItem.data = listItemData;

        listItem.images = [];

        listItem.html = {};
        listItem.html.listItemBlock = $('<div>', {'class': 'list-item-block'});
        listItem.html.nameBlock = $('<div>').html($('<h4>').html(listItem.data.name));
        listItem.html.addressBlock = $('<div>').html(listItem.data.address);
        listItem.html.mainImageBlock = $('<div>', {'class': 'main-image-block'});
        listItem.html.textInfoBlock = $('<div>', {'class': 'text-info-block'});
        listItem.html.infoBlock = $('<div>', {'class': 'info-block'});
        listItem.html.imagesBlock = $('<div>');
        listItem.html.mapBlock = $('<div>');
        listItem.html.loadingBlock = $('<div>').html('Загрузка...');
        listItem.html.loadingBlock.hide();


        listItem.html.infoBlock.append(listItem.html.mainImageBlock);
        listItem.html.textInfoBlock.append(listItem.html.nameBlock);
        listItem.html.textInfoBlock.append(listItem.html.addressBlock);
        listItem.html.infoBlock.append(listItem.html.textInfoBlock);
        listItem.html.listItemBlock.append(listItem.html.infoBlock);
        listItem.html.listItemBlock.append(listItem.html.mapBlock);
        listItem.html.listItemBlock.append(listItem.html.imagesBlock);
        listItem.html.listItemBlock.append(listItem.html.loadingBlock);

        if (listItem.data.lat && listItem.data.long) {
            listItem.html.mapBlock.append($('<hr>'));
            listItem.html.mapBlock.append($('<h4>', {'style': 'text-align: center;'}).html('Карты'));
            var doubleGisUrl = 'https://2gis.ru/?queryState=center%2F' + listItem.data.long + '%2C' + listItem.data.lat + '%2Fzoom%2F18';
            var googleUrl = 'https://maps.google.ru/?ll=' + listItem.data.lat+ ',' + listItem.data.long+ '&z=17';
            var yandexUrl = 'http://maps.yandex.ru/?ll=' + listItem.data.long + ',' + listItem.data.lat + '&z=17';
            var wikimapiaUrl = 'http://wikimapia.org/#lat=' + listItem.data.lat + '&lon=' + listItem.data.long + '&z=17';
            var openStreetMapUrl = 'http://openstreetmap.org/?lat=' + listItem.data.lat + '&lon=' + listItem.data.long + '&zoom=17';
            listItem.html.mapBlock.append($('<a>', {'href': openStreetMapUrl, 'target': '_blank'}).html('[OSM]'));
            listItem.html.mapBlock.append($('<span>').html('&nbsp;'));
            listItem.html.mapBlock.append($('<a>', {'href': googleUrl, 'target': '_blank'}).html('[Google]'));
            listItem.html.mapBlock.append($('<span>').html('&nbsp;'));
            listItem.html.mapBlock.append($('<a>', {'href': yandexUrl, 'target': '_blank'}).html('[Yandex]'));
            listItem.html.mapBlock.append($('<span>').html('&nbsp;'));
            listItem.html.mapBlock.append($('<a>', {'href': wikimapiaUrl, 'target': '_blank'}).html('[Wikimapia]'));
            listItem.html.mapBlock.append($('<span>').html('&nbsp;'));
            listItem.html.mapBlock.append($('<a>', {'href': doubleGisUrl, 'target': '_blank'}).html('[2ГИС]'));
        }

        $('#lists').append(listItem.html.listItemBlock);

        this._listItems.push(listItem);

        return listItem;
    },

    warnImageNotSelected: function(listItem) {
        listItem.html.listItemBlock.addClass('list-item-warnings');
    },

    setMainImage: function(listItem, image) {
        listItem.html.mainImageBlock.append(
            $('<img>', {'alt': 'Image', 'src': image.thumb})
        )
    },

    addImages: function(listItem, imagesInfo, categoryType) {
        imagesInfo.forEach(function(imageInfo) {
            var existingImage = null;
            listItem.images.forEach(function(image) {
                if (image.imageInfo.image === imageInfo.image) {
                    existingImage = image;
                }
            });
            if (!existingImage) {
                listItem.images.push({
                    imageInfo: imageInfo,
                    categoryTypes: [categoryType]
                });
            } else {
                existingImage.categoryTypes.push(categoryType);
            }
        });

        this.showImages(listItem);
    },

    showImages: function(listItem) {
        var self = this;
        var colsPerRow = 4;

        listItem.html.imagesBlock.html('');

        if (listItem.images.length > 0) {
            listItem.html.imagesBlock.append($('<hr>'));
            listItem.html.imagesBlock.append($('<h4>', {'style': 'text-align: center;'}).html('Галерея'));
        }

        for (var row = 0; row < listItem.images.length / colsPerRow; row++) {
            var rowElem = $('<div>', {'style': 'display: flex; flex-direction: row;'});
            listItem.html.imagesBlock.append(rowElem);
            for (var col = 0; col < colsPerRow; col++) {
                var itemNum = row * colsPerRow + col;
                if (listItem.images.length > itemNum) {
                    var imageItem = listItem.images[itemNum];
                    rowElem.append(self.createImageElement(imageItem.imageInfo, imageItem.categoryTypes));
                }
            }
        }
    },

    createImageElement: function(imageInfo, categoryTypes) {
        var imageBlock = $('<div>', {'class': 'image-block'});

        var commonsUrl = 'https://commons.wikimedia.org/wiki/' + imageInfo.image;
        var imgBlock = $('<div>');
        var link = $('<a>', {'href': commonsUrl, 'target': '_blank'});
        var image = $('<img>', {'src': imageInfo.thumb});
        link.append(image);
        imgBlock.append(link);
        imageBlock.append(imgBlock);

        var actions = [
            {
                title: 'Смотреть в полном размере',
                action: function() {
                    window.open(imageInfo.url);
                }
            },
            {
                title: 'Смотреть на Commons',
                action: function() {
                    window.open(commonsUrl);
                }
            }
        ];

        var actionsList = $('<ul>', {'class': 'dropdown-menu', 'style': 'font-size: 12px;'});
        actions.forEach(function(action) {
            var actionListItemLink = $('<a>', {'href': 'javascript:;'}).append(action.title);
            actionListItemLink.click(function() {action.action();});
            var actionListItem = $('<li>').append(actionListItemLink);
            actionsList.append(actionListItem);
        });

        var actionsBlock = $('<div>', {'style': 'display: flex; flex-direction: row; flex-wrap: wrap; margin-top: 5px;'}).append(
            $('<div>', {'class': 'dropdown'})
                .append(
                    $('<button>', {
                        'class': 'btn btn-default btn-xs dropdown-toggle',
                        'type': 'button',
                        'data-toggle': 'dropdown',
                        'aria-haspopup': 'true',
                        'aria-expanded': 'true'
                    }).append('Действия').append('<span>', {'class': 'caret'})
                )
                .append(actionsList)
        );

        imageBlock.append(actionsBlock);

        var categoriesBlock = $('<div>', {'class': 'btn-group'});
        categoryTypes.forEach(function(categoryType) {
            if (categoryType === 'commons') {
                categoryType = 'Commons';
            } else {
                categoryType = 'WLM';
            }
            categoriesBlock.append(
                $('<button>', {'class': 'btn btn-default btn-xs', 'style': 'font-size: 12px;'}).html(
                    'Категория:' + categoryType
                )
            );
        });
        actionsBlock.append(categoriesBlock);

        if (imageInfo.text.indexOf('{{Cultural Heritage Russia') < 0) {
            var warningsBlock = $('<div>', {'class': 'btn-group', 'style': 'margin-top: 5px'});
            warningsBlock.append(
                $('<button>', {'class': 'btn btn-default btn-xs btn-warning', 'style': 'font-size: 12px;'}).html(
                    'Нет шаблона CHR'
                )
            );
            actionsBlock.append(warningsBlock);
        }

        return imageBlock;
    },

    startLoading: function(listItem) {
        listItem.html.loadingBlock.show();
    },

    finishedLoading: function(listItem) {
        listItem.html.loadingBlock.hide();
    },

    parseLists: function(pageContents) {
        var listItems = [];

        var monumentStrs = pageContents.match(/{{\s*monument\s*\|[\s\S]*?}}/gm);

        monumentStrs.forEach(function(monumentStr) {
            var listItem = {};
            monumentStr.split('|').forEach(function(parameterStr) {
                var parameterParts = splitWithTail(parameterStr, '=', 2);
                if (parameterParts.length >= 2) {
                    listItem[parameterParts[0].trim()] = parameterParts[1].trim();
                }
            });
            listItems.push(listItem);
        });
        return listItems;
    },

    _getCurrentCulturalHeritageCategory: function() {
        return $('#culturalHeritageCategory').val();
    }
};

$.when($.ready).then(function() {
    log.init();
    application.init();
});
