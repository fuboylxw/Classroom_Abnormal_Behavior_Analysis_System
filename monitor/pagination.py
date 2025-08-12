# pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'code': 200,
            'data': data,
            'pagination': {
                'current_page': self.page.number,
                'page_size': self.page.paginator.per_page,
                'total_records': self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages
            }
        })
