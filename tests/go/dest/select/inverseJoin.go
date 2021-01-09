package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	CategoryID uint64
	ID         uint64
	Title      string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable) ([]PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `db_post`.`title` AS `title`, `join_1`.`category_id` AS `category_id`, `join_2`.`id` AS `id` FROM `db_post` AS `db_post` INNER JOIN `post_category` AS `join_1` ON `join_1`.`post_id` = `db_post`.`id` INNER JOIN `category` AS `join_2` ON `join_2`.`id` = `join_1`.`category_id` WHERE `db_post`.`title`|`join_1`.`category_id`|`join_2`.`id` ORDER BY `id`, `db_post`.`user_id` DESC")
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectTResult
		err = rows.Scan(&item.Title, &item.CategoryID, &item.ID)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
